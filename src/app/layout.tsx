import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "产品升云阶",
  description: "帮助 B 端产品经理从执行层向高级 PM 跃迁的智能训练平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
