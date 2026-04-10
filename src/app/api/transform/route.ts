import { Client } from "@gradio/client";
import { readFileSync } from "fs";
import { join } from "path";

interface TransformModelConfig {
  space: string;
  endpoint: string;
  needsStyleImage: boolean;
  buildInput: (params: {
    imageBlob: Blob;
    styleBlob?: Blob;
    prompt: string;
    strength: number;
  }) => Record<string, unknown>;
}

const MODEL_MAP: Record<string, TransformModelConfig> = {
  "flux-style-shaping": {
    space: "multimodalart/flux-style-shaping",
    endpoint: "/generate_image",
    needsStyleImage: true,
    buildInput: ({ imageBlob, styleBlob, prompt, strength }) => ({
      prompt,
      structure_image: imageBlob,
      style_image: styleBlob!,
      depth_strength: 15,
      style_strength: strength,
    }),
  },
  "instruct-pix2pix": {
    space: "Manjushri/Instruct-Pix-2-Pix",
    endpoint: "/predict",
    needsStyleImage: false,
    buildInput: ({ imageBlob, prompt, strength }) => ({
      source_img: imageBlob,
      instructions: prompt,
      guide: 7.5,
      steps: 20,
      seed: -1,
      Strength: strength,
    }),
  },
  "cosxl-edit": {
    space: "multimodalart/cosxl",
    endpoint: "/run_edit",
    needsStyleImage: false,
    buildInput: ({ imageBlob, prompt }) => ({
      image: imageBlob,
      prompt,
      negative_prompt: "",
      guidance_scale: 7,
      steps: 20,
    }),
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl, styleImage, styleStrength, model } =
      await request.json();

    if (!prompt || !imageUrl) {
      return Response.json(
        { error: "이미지와 스타일을 선택해주세요" },
        { status: 400 }
      );
    }

    const config = MODEL_MAP[model] ?? MODEL_MAP["flux-style-shaping"];

    // 유저 이미지: Base64 Data URL → Blob
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return Response.json(
        { error: "이미지 형식이 올바르지 않습니다" },
        { status: 400 }
      );
    }
    const mimeType = `image/${base64Match[1]}`;
    const buffer = Buffer.from(base64Match[2], "base64");
    const imageBlob = new Blob([buffer], { type: mimeType });

    // 스타일 이미지 (필요한 모델만)
    let styleBlob: Blob | undefined;
    if (config.needsStyleImage && styleImage) {
      const stylePath = join(process.cwd(), "public", styleImage);
      const styleBuffer = readFileSync(stylePath);
      styleBlob = new Blob([styleBuffer], { type: "image/jpeg" });
    }

    const app = await Client.connect(config.space);

    const input = config.buildInput({
      imageBlob,
      styleBlob,
      prompt,
      strength: styleStrength ?? 0.5,
    });

    const result = await app.predict(config.endpoint, input);

    // 결과에서 이미지 URL 추출
    const data = result.data as unknown[];
    let imgUrl: string | undefined;

    for (const item of data) {
      if (item && typeof item === "object" && "url" in item) {
        imgUrl = (item as { url: string }).url;
        break;
      }
    }

    if (!imgUrl) {
      return Response.json(
        { error: "변환 결과가 없습니다" },
        { status: 502 }
      );
    }

    // Gradio 임시 URL → Base64
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) {
      return Response.json(
        { error: "결과 이미지를 가져올 수 없습니다" },
        { status: 502 }
      );
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get("content-type") || "image/png";
    const base64 = imgBuffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";

    if (message.includes("queue") || message.includes("Queue")) {
      return Response.json(
        { error: "대기열이 가득 찼습니다. 잠시 후 다시 시도해주세요" },
        { status: 503 }
      );
    }

    return Response.json({ error: `변환 실패: ${message}` }, { status: 500 });
  }
}
