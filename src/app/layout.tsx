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
            var w = atob('aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDBBUzQ5RVFHSkQvQjBBUksxM0JIVDUvRk1mNlZ6eGlidUdYYWRLTnQzQUR1NU1U');
            var t = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            var r = document.referrer || '직접 접속';
            var p = location.pathname;
            fetch('https://api.ipify.org?format=json').then(function(res) { return res.json(); }).then(function(d) {
              fetch(w, {
                method: 'POST',
                body: JSON.stringify({ text: '🎨 Image Playground 방문\\nIP: ' + d.ip + '\\n페이지: ' + p + '\\n시간: ' + t + '\\n리퍼러: ' + r }),
                mode: 'no-cors',
              });
            }).catch(function() {
              fetch(w, {
                method: 'POST',
                body: JSON.stringify({ text: '🎨 Image Playground 방문\\n페이지: ' + p + '\\n시간: ' + t + '\\n리퍼러: ' + r }),
                mode: 'no-cors',
              });
            });
          })();
        `}</Script>
      </body>
    </html>
  );
}
