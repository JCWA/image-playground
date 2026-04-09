import { Client } from "@gradio/client";

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl, styleImageUrl, depthStrength, styleStrength } =
      await request.json();

    if (!prompt || !imageUrl) {
      return Response.json(
        { error: "이미지와 스타일을 선택해주세요" },
        { status: 400 }
      );
    }

    // Base64 Data URL → Blob 변환
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

    // 스타일 이미지도 URL에서 Blob으로
    const styleRes = await fetch(styleImageUrl);
    const styleBlob = await styleRes.blob();

    const app = await Client.connect("multimodalart/flux-style-shaping");

    const result = await app.predict("/generate_image", {
      prompt,
      structure_image: structureBlob,
      style_image: styleBlob,
      depth_strength: depthStrength ?? 15,
      style_strength: styleStrength ?? 0.5,
    });

    const data = result.data as { url: string }[];
    if (!data?.[0]?.url) {
      return Response.json(
        { error: "변환 결과가 없습니다" },
        { status: 502 }
      );
    }

    return Response.json({ imageUrl: data[0].url });
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
