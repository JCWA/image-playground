import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Text to Image",
  description: "텍스트 프롬프트로 AI 이미지를 생성합니다",
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
