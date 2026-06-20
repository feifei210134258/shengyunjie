import type { Metadata } from "next";
import { Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "升云阶 - B端产品经理智能成长平台",
  description:
    "深度诊断、画像建模、针对性训练与反馈迭代，帮助 B 端产品经理从执行层向高级 PM 跃迁。",
  icons: {
    icon: "/icon.svg",
  },
};

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${hanken.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#F7F9FB" />
      </head>
      <body suppressHydrationWarning>
        <div className="grain-overlay" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
