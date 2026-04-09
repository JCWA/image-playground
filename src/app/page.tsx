import Link from "next/link";

const MODES = [
  {
    href: "/generate",
    title: "Text to Image",
    description: "텍스트 프롬프트를 입력하면 AI가 이미지를 생성합니다",
    icon: "T",
    color: "purple",
  },
  {
    href: "/transform",
    title: "Image Transform",
    description: "사진을 업로드하고 스타일을 선택하면 AI가 변환합니다",
    icon: "I",
    color: "pink",
  },
] as const;

const colorMap = {
  purple: {
    bg: "bg-purple-600/10",
    border: "border-purple-500/20 hover:border-purple-500/50",
    icon: "bg-purple-600 text-white",
    text: "text-purple-400",
  },
  pink: {
    bg: "bg-pink-600/10",
    border: "border-pink-500/20 hover:border-pink-500/50",
    icon: "bg-pink-600 text-white",
    text: "text-pink-400",
  },
} as const;

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 py-20">
      <h1 className="text-4xl font-bold mb-3">Image Playground</h1>
      <p className="text-zinc-400 mb-12 text-center">
        AI 이미지 생성 & 변환을 직접 체험해보세요
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {MODES.map(({ href, title, description, icon, color }) => {
          const c = colorMap[color];
          return (
            <Link
              key={href}
              href={href}
              className={`group p-6 rounded-2xl border ${c.border} ${c.bg} transition-all hover:scale-[1.02]`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-xl font-bold mb-4`}
              >
                {icon}
              </div>
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="text-sm text-zinc-400">{description}</p>
              <span
                className={`inline-block mt-4 text-sm ${c.text} group-hover:underline`}
              >
                시작하기 &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
