import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
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
  robots: {
    index: false,
    follow: false,
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
        <Script id="visitor-notify" strategy="afterInteractive">{`
          (function() {
            var ua = navigator.userAgent || '';
            if (/bot|crawl|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|semrush|ahref|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt/i.test(ua)) return;
            var t = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            fetch('https://notify.channy.dev/pulse', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: '🎨 Image Playground 방문',
                text: '페이지: ' + location.pathname + ' · 시간: ' + t,
                level: 'info',
              }),
            }).catch(function() {});
          })();
        `}</Script>
      </body>
    </html>
  );
}
