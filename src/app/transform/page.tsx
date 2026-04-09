"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";

const STYLE_PRESETS = [
  {
    id: "wanghong",
    label: "왕홍풍",
    prompt:
      "Chinese influencer style portrait, glamorous makeup, soft lighting, beauty filter, high fashion photography",
  },
  {
    id: "photobooth",
    label: "인생네컷",
    prompt:
      "Korean photo booth style portrait, cute pose, pastel background, soft filter, bright studio lighting",
  },
  {
    id: "cyberpunk",
    label: "사이버펑크",
    prompt:
      "Cyberpunk style, neon lights, futuristic cityscape, dark atmosphere, sci-fi, high tech, cinematic",
  },
  {
    id: "watercolor",
    label: "수채화",
    prompt:
      "Watercolor painting style, soft brush strokes, artistic, delicate colors, fine art illustration",
  },
  {
    id: "anime",
    label: "애니메이션",
    prompt:
      "Anime style illustration, vibrant colors, clean lines, Japanese animation, detailed character art",
  },
  {
    id: "vintage",
    label: "빈티지 필름",
    prompt:
      "Vintage film photography, grain texture, warm tones, 35mm film, retro nostalgic mood",
  },
] as const;

export default function TransformPage() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransform = async () => {
    if (!selectedStyle || loading) return;

    const preset = STYLE_PRESETS.find((s) => s.id === selectedStyle);
    if (!preset) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const fullPrompt = subject.trim()
        ? `${subject.trim()}, ${preset.prompt}`
        : preset.prompt;

      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "변환에 실패했습니다");
      }

      const data = await res.json();
      setResultUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `style-${selectedStyle}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Style Generator</h1>
      <p className="text-zinc-400 mb-8">
        스타일을 선택하고 주제를 입력하면 AI가 이미지를 생성합니다
      </p>

      <div className="w-full max-w-2xl space-y-6">
        {/* 스타일 선택 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">
            스타일 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedStyle === style.id
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/50"
                }`}
              >
                <p className="font-medium text-sm">{style.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 주제 입력 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">
            주제 입력 (선택사항)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleTransform()}
            placeholder="예: a young woman, a cat, a city street"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-purple-500 focus:outline-none text-white placeholder:text-zinc-500 disabled:opacity-50"
          />
        </div>

        {/* 생성 버튼 */}
        <Button
          onClick={handleTransform}
          disabled={!selectedStyle || loading}
          className="w-full py-3"
        >
          {loading ? "생성 중..." : "생성하기"}
        </Button>

        {/* 에러 */}
        {error && (
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && <Spinner text="AI가 이미지를 생성하고 있어요..." />}

        {/* 결과 */}
        {resultUrl && (
          <div className="space-y-4">
            <img
              src={resultUrl}
              alt="생성 결과"
              className="w-full rounded-xl border border-zinc-700"
            />
            <Button variant="secondary" onClick={() => handleDownload(resultUrl)}>
              다운로드
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
