import { Client } from "@gradio/client";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl, styleImage, styleStrength } =
      await request.json();

    if (!prompt || !imageUrl || !styleImage) {
      return Response.json(
        { error: "이미지와 스타일을 선택해주세요" },
        { status: 400 }
      );
    }

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
    const structureBlob = new Blob([buffer], { type: mimeType });

    // 스타일 이미지: public 폴더에서 읽기
    const stylePath = join(process.cwd(), "public", styleImage);
    const styleBuffer = readFileSync(stylePath);
    const styleBlob = new Blob([styleBuffer], { type: "image/jpeg" });

    const app = await Client.connect("multimodalart/flux-style-shaping");

    const result = await app.predict("/generate_image", {
      prompt,
      structure_image: structureBlob,
      style_image: styleBlob,
      depth_strength: 15,
      style_strength: styleStrength ?? 0.5,
    });

    const data = result.data as { url: string }[];
    if (!data?.[0]?.url) {
      return Response.json(
        { error: "변환 결과가 없습니다" },
        { status: 502 }
      );
    }

    // Gradio 임시 URL → Base64 Data URL로 변환
    const imgRes = await fetch(data[0].url);
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
