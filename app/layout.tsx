import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "班级通讯录",
  description: "同学联系方式登记与查询（数据源：student.message）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
