"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";

const MODELS = [
  // HuggingFace Inference API (빠름)
  {
    id: "flux-schnell-hf",
    label: "FLUX.1 Schnell",
    description: "빠른 생성, 고품질",
    provider: "HuggingFace",
  },
  {
    id: "sd3-medium",
    label: "Stable Diffusion 3",
    description: "안정적, 다양한 스타일",
    provider: "HuggingFace",
  },
  // Gradio Spaces (느리지만 고품질)
  {
    id: "flux-schnell-gradio",
    label: "FLUX.1 Schnell (Gradio)",
    description: "고해상도 1024px",
    provider: "Gradio",
  },
  {
    id: "flux-merged",
    label: "FLUX.1 Merged",
    description: "고품질 통합 모델",
    provider: "Gradio",
  },
  {
    id: "flux-krea-dev",
    label: "FLUX Krea Dev",
    description: "크리에이티브 아트",
    provider: "Gradio",
  },
  {
    id: "flux-realism",
    label: "FLUX Realism",
    description: "사실적인 사진 스타일",
    provider: "Gradio",
  },
  {
    id: "hyper-flux",
    label: "Hyper-FLUX (ByteDance)",
    description: "8스텝 고속 생성",
    provider: "Gradio",
  },
];

const EXAMPLES = [
  "A cat wearing sunglasses on a beach, digital art",
  "Cyberpunk city at night with neon lights, cinematic",
  "Oil painting of a Korean mountain village in autumn",
  "Astronaut riding a horse on Mars, photorealistic",
  "Cozy coffee shop interior, Studio Ghibli style",
  "Portrait of a samurai in watercolor style",
];

interface HistoryItem {
  prompt: string;
  imageUrl: string;
  model: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, model: selectedModel }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "생성에 실패했습니다");
      }

      const data = await res.json();
      const modelLabel =
        MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel;
      setHistory((prev) => [
        { prompt: trimmed, imageUrl: data.imageUrl, model: modelLabel },
        ...prev,
      ]);
      setPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const currentModel = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Text to Image</h1>
      <p className="text-zinc-400 mb-8">
        프롬프트를 입력하면 AI가 이미지를 생성합니다
      </p>

      <div className="w-full max-w-2xl space-y-4">
        {/* 모델 선택 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">모델 선택</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:outline-none text-white disabled:opacity-50 cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.description}
              </option>
            ))}
          </select>
          {currentModel?.provider === "Gradio" && (
            <p className="text-xs text-yellow-500 mt-1">
              Gradio 모델은 GPU 웨이크업으로 1~2분 걸릴 수 있어요
            </p>
          )}
        </div>

        {/* 프롬프트 입력 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="이미지를 설명해주세요 (영어 권장)"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:outline-none text-white placeholder:text-zinc-500 disabled:opacity-50"
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? "생성 중..." : "생성"}
          </Button>
        </div>

        {/* 예시 프롬프트 */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* 에러 */}
        {error && (
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <Spinner
            text={
              currentModel?.provider === "Gradio"
                ? "AI가 이미지를 생성하고 있어요... (최대 1~2분 소요)"
                : "AI가 이미지를 생성하고 있어요..."
            }
          />
        )}

        {/* 히스토리 */}
        {history.length > 0 && (
          <div className="space-y-6 pt-4">
            {history.map((item, i) => (
              <div
                key={`${item.prompt}-${i}`}
                className="rounded-xl border border-zinc-800 overflow-hidden"
              >
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full"
                />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-zinc-400 truncate flex-1">
                      {item.prompt}
                    </p>
                    <Button
                      variant="secondary"
                      className="text-sm shrink-0"
                      onClick={() =>
                        handleDownload(item.imageUrl, `generated-${i}.png`)
                      }
                    >
                      다운로드
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-600">{item.model}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
