const HF_API_TOKEN = process.env.HF_API_TOKEN!;
const MODEL = "black-forest-labs/FLUX.1-schnell";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: "프롬프트를 입력해주세요" }, { status: 400 });
    }

    const res = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 503) {
        return Response.json(
          { error: "모델을 로딩 중입니다. 30초 후 다시 시도해주세요" },
          { status: 503 }
        );
      }
      if (errText.includes("rate limit")) {
        return Response.json(
          { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요" },
          { status: 429 }
        );
      }
      return Response.json({ error: `생성 실패: ${errText}` }, { status: 500 });
    }

    const blob = await res.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `생성 실패: ${message}` }, { status: 500 });
  }
}
