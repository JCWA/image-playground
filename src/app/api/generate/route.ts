import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY!,
});

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: "프롬프트를 입력해주세요" }, { status: 400 });
    }

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: "square_hd",
        num_images: 1,
      },
    });

    const images = (result.data as { images: { url: string }[] }).images;
    if (!images?.[0]?.url) {
      return Response.json({ error: "이미지 생성 결과가 없습니다" }, { status: 502 });
    }

    return Response.json({ imageUrl: images[0].url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";

    if (message.includes("quota") || message.includes("credit")) {
      return Response.json({ error: "API 크레딧이 소진되었습니다" }, { status: 429 });
    }
    if (message.includes("timeout") || message.includes("TIMEOUT")) {
      return Response.json({ error: "생성 시간이 초과되었습니다. 다시 시도해주세요" }, { status: 504 });
    }

    return Response.json({ error: `생성 실패: ${message}` }, { status: 500 });
  }
}
