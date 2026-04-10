import { Client } from "@gradio/client";

const HF_API_TOKEN = process.env.HF_API_TOKEN!;

const HF_MODELS = [
  "black-forest-labs/FLUX.1-schnell",
  "stabilityai/stable-diffusion-3-medium-diffusers",
];

const GRADIO_MODELS = [
  "black-forest-labs/FLUX.1-schnell",
  "multimodalart/FLUX.1-merged",
];

async function generateViaHF(model: string, prompt: string): Promise<Buffer> {
  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
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
    if (res.status === 503) throw new Error("모델을 로딩 중입니다. 30초 후 다시 시도해주세요");
    if (errText.includes("rate limit")) throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요");
    throw new Error(errText);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function generateViaGradio(space: string, prompt: string): Promise<Buffer> {
  const app = await Client.connect(space, {
    token: HF_API_TOKEN as `hf_${string}`,
  });

  const result = await app.predict("/infer", {
    prompt,
    seed: 0,
    randomize_seed: true,
    width: 1024,
    height: 1024,
    num_inference_steps: space.includes("merged") ? 8 : 4,
    ...(space.includes("merged") ? { guidance_scale: 3.5 } : {}),
  });

  const data = result.data as [{ url: string }, number];
  if (!data?.[0]?.url) throw new Error("생성 결과가 없습니다");

  const imgRes = await fetch(data[0].url);
  if (!imgRes.ok) throw new Error("결과 이미지를 가져올 수 없습니다");
  return Buffer.from(await imgRes.arrayBuffer());
}

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return Response.json({ error: "프롬프트를 입력해주세요" }, { status: 400 });
    }

    let buffer: Buffer;

    if (HF_MODELS.includes(model)) {
      buffer = await generateViaHF(model, prompt);
    } else if (GRADIO_MODELS.includes(model)) {
      buffer = await generateViaGradio(model, prompt);
    } else {
      // 기본값: HF FLUX.1-schnell
      buffer = await generateViaHF(HF_MODELS[0], prompt);
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `생성 실패: ${message}` }, { status: 500 });
  }
}
