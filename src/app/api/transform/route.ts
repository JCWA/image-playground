import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl, strength } = await request.json();

    if (!prompt || !imageUrl) {
      return Response.json(
        { error: "이미지와 스타일을 선택해주세요" },
        { status: 400 }
      );
    }

    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        prompt,
        image_url: imageUrl,
        strength: strength ?? 0.75,
        num_images: 1,
      },
    });

    const images = (result.data as { images: { url: string }[] }).images;
    if (!images?.[0]?.url) {
      return Response.json({ error: "이미지 변환 결과가 없습니다" }, { status: 502 });
    }

    return Response.json({ imageUrl: images[0].url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";

    if (message.includes("quota") || message.includes("credit")) {
      return Response.json({ error: "API 크레딧이 소진되었습니다" }, { status: 429 });
    }
    if (message.includes("timeout") || message.includes("TIMEOUT")) {
      return Response.json({ error: "변환 시간이 초과되었습니다. 다시 시도해주세요" }, { status: 504 });
    }

    return Response.json({ error: `변환 실패: ${message}` }, { status: 500 });
  }
}
