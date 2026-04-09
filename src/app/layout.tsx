import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Image Playground",
    template: "%s | Image Playground",
  },
  description: "AI 이미지 생성 & 스타일 변환 플레이그라운드",
  openGraph: {
    title: "Image Playground",
    description: "AI 이미지 생성 & 스타일 변환 플레이그라운드",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white font-[family-name:var(--font-geist)]">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
