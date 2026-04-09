import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Transform",
  description: "사진을 업로드하고 AI로 스타일을 변환합니다",
};

export default function TransformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
