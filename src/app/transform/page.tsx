"use client";

import { useState, useRef, DragEvent } from "react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";

const STYLE_PRESETS = [
  {
    id: "cyberpunk",
    label: "사이버펑크",
    prompt: "cyberpunk style, neon lights, futuristic dark atmosphere",
    styleImage: "/styles/cyberpunk.jpg",
  },
  {
    id: "watercolor",
    label: "수채화",
    prompt: "watercolor painting, soft brush strokes, artistic",
    styleImage: "/styles/watercolor.jpg",
  },
  {
    id: "anime",
    label: "애니메이션",
    prompt: "anime style illustration, vibrant colors, clean lines",
    styleImage: "/styles/anime.jpg",
  },
  {
    id: "vintage",
    label: "빈티지 필름",
    prompt: "vintage 35mm film photography, grain, warm tones",
    styleImage: "/styles/vintage.jpg",
  },
  {
    id: "oilpainting",
    label: "유화",
    prompt: "oil painting on canvas, rich texture, classical art style",
    styleImage: "/styles/oilpainting.jpg",
  },
  {
    id: "neon",
    label: "네온 팝아트",
    prompt: "neon pop art style, bold colors, graphic design",
    styleImage: "/styles/neon.jpg",
  },
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function TransformPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [styleStrength, setStyleStrength] = useState(0.5);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPG, PNG, WebP 파일만 지원합니다");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 10MB 이하만 가능합니다");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResultUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toBase64DataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleTransform = async () => {
    if (!imageFile || !selectedStyle || loading) return;

    const preset = STYLE_PRESETS.find((s) => s.id === selectedStyle);
    if (!preset) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const imageUrl = await toBase64DataUrl(imageFile);

      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: preset.prompt,
          imageUrl,
          styleImage: preset.styleImage,
          styleStrength,
        }),
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

  const handleDownload = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `transformed-${selectedStyle}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Image Transform</h1>
      <p className="text-zinc-400 mb-8">
        사진을 업로드하고 스타일을 선택하면 AI가 변환합니다
      </p>

      <div className="w-full max-w-2xl space-y-6">
        {/* 이미지 업로드 */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">
            이미지 업로드
          </label>
          {!imagePreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <p className="text-zinc-400 mb-1">
                클릭하거나 이미지를 드래그해서 업로드
              </p>
              <p className="text-xs text-zinc-600">
                JPG, PNG, WebP / 최대 10MB
              </p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="업로드된 이미지"
                className="max-h-80 rounded-xl border border-zinc-700"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

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
                className={`rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${
                  selectedStyle === style.id
                    ? "border-purple-500 ring-2 ring-purple-500/50"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <img
                  src={style.styleImage}
                  alt={style.label}
                  className="w-full h-24 object-cover"
                />
                <p className="p-2 font-medium text-sm">{style.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 스타일 강도 슬라이더 */}
        {selectedStyle && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400">스타일 강도</label>
              <span className="text-sm text-purple-400 font-mono">
                {Math.round(styleStrength * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={styleStrength}
              onChange={(e) => setStyleStrength(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>원본 유지</span>
              <span>강하게 변환</span>
            </div>
          </div>
        )}

        {/* 변환 버튼 */}
        <Button
          onClick={handleTransform}
          disabled={!imageFile || !selectedStyle || loading}
          className="w-full py-3"
        >
          {loading ? "변환 중..." : "변환하기"}
        </Button>

        {/* 에러 */}
        {error && (
          <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <Spinner text="AI가 이미지를 변환하고 있어요... (최대 1~2분 소요)" />
        )}

        {/* Before / After 결과 */}
        {resultUrl && imagePreview && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Before / After</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2">원본</p>
                <img
                  src={imagePreview}
                  alt="원본"
                  className="w-full rounded-xl border border-zinc-700"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">변환 결과</p>
                <img
                  src={resultUrl}
                  alt="변환 결과"
                  className="w-full rounded-xl border border-zinc-700"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleDownload(resultUrl)}
            >
              다운로드
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
