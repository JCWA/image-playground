import { Client } from "@gradio/client";

const HF_API_TOKEN = process.env.HF_API_TOKEN!;

interface ModelConfig {
  type: "hf" | "gradio";
  model: string;
  space?: string;
  endpoint?: string;
  params?: Record<string, unknown>;
}

const MODEL_MAP: Record<string, ModelConfig> = {
  // HuggingFace Inference API
  "flux-schnell-hf": {
    type: "hf",
    model: "black-forest-labs/FLUX.1-schnell",
  },
  "sd3-medium": {
    type: "hf",
    model: "stabilityai/stable-diffusion-3-medium-diffusers",
  },
  // Gradio Spaces
  "flux-schnell-gradio": {
    type: "gradio",
    space: "black-forest-labs/FLUX.1-schnell",
    model: "black-forest-labs/FLUX.1-schnell",
    endpoint: "/infer",
    params: { num_inference_steps: 4 },
  },
  "flux-merged": {
    type: "gradio",
    space: "multimodalart/FLUX.1-merged",
    model: "multimodalart/FLUX.1-merged",
    endpoint: "/infer",
    params: { guidance_scale: 3.5, num_inference_steps: 8 },
  },
  "flux-krea-dev": {
    type: "gradio",
    space: "prithivMLmods/FLUX-REALISM",
    model: "prithivMLmods/FLUX-REALISM",
    endpoint: "/run",
    params: {
      model_choice: "flux.1-krea-dev",
      negative_prompt: "",
      use_negative_prompt: false,
      guidance_scale: 3.5,
      num_inference_steps: 8,
      style_name: "3840 x 2160",
      num_images: 1,
      zip_images: false,
    },
  },
  "flux-realism": {
    type: "gradio",
    space: "prithivMLmods/FLUX-REALISM",
    model: "prithivMLmods/FLUX-REALISM",
    endpoint: "/run",
    params: {
      model_choice: "flux.1-dev-realism",
      negative_prompt: "",
      use_negative_prompt: false,
      guidance_scale: 3.5,
      num_inference_steps: 8,
      style_name: "3840 x 2160",
      num_images: 1,
      zip_images: false,
    },
  },
  "hyper-flux": {
    type: "gradio",
    space: "ByteDance/Hyper-FLUX-8Steps-LoRA",
    model: "ByteDance/Hyper-FLUX-8Steps-LoRA",
    endpoint: "/process_image",
    params: { height: 1024, width: 1024, steps: 8, scales: 3.5 },
  },
};

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
    if (res.status === 503)
      throw new Error("모델을 로딩 중입니다. 30초 후 다시 시도해주세요");
    if (errText.includes("rate limit"))
      throw new Error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요");
    throw new Error(errText);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function generateViaGradio(
  config: ModelConfig,
  prompt: string
): Promise<Buffer> {
  const app = await Client.connect(config.space!, {
    token: HF_API_TOKEN as `hf_${string}`,
  });

  const input: Record<string, unknown> = {
    prompt,
    seed: 0,
    randomize_seed: true,
    width: 1024,
    height: 1024,
    ...config.params,
  };

  const result = await app.predict(config.endpoint!, input);

  // 결과 형태가 Space마다 다름
  const data = result.data as unknown[];
  let imgUrl: string | undefined;

  for (const item of data) {
    if (item && typeof item === "object" && "url" in item) {
      imgUrl = (item as { url: string }).url;
      break;
    }
    // 배열 안에 배열 (FLUX-REALISM)
    if (Array.isArray(item)) {
      for (const sub of item) {
        if (sub && typeof sub === "object" && "image" in sub) {
          const img = (sub as { image: { url: string } }).image;
          if (img?.url) {
            imgUrl = img.url;
            break;
          }
        }
      }
    }
  }

  if (!imgUrl) throw new Error("생성 결과가 없습니다");

  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) throw new Error("결과 이미지를 가져올 수 없습니다");
  return Buffer.from(await imgRes.arrayBuffer());
}

export async function POST(request: Request) {
  try {
    const { prompt, model } = await request.json();

    if (!prompt) {
      return Response.json(
        { error: "프롬프트를 입력해주세요" },
        { status: 400 }
      );
    }

    const config = MODEL_MAP[model] ?? MODEL_MAP["flux-schnell-hf"];
    let buffer: Buffer;

    if (config.type === "hf") {
      buffer = await generateViaHF(config.model, prompt);
    } else {
      buffer = await generateViaGradio(config, prompt);
    }

    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return Response.json({ imageUrl: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return Response.json({ error: `생성 실패: ${message}` }, { status: 500 });
  }
}
