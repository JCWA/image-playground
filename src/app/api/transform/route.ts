import { Client, handle_file } from "@gradio/client";

export async function POST(request: Request) {
  try {
    const { prompt, imageUrl } = await request.json();

    if (!prompt || !imageUrl) {
      return Response.json(
        { error: "이미지와 스타일을 선택해주세요" },
        { status: 400 }
      );
    }

    const app = await Client.connect("Manjushri/Instruct-Pix-2-Pix");

    const result = await app.predict("/predict", {
      source_img: handle_file(imageUrl),
      instructions: prompt,
      guide: 7.5,
      steps: 20,
      seed: -1,
      Strength: 0.7,
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
