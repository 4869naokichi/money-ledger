import type { Metadata } from "next";
import { AppNav } from "./app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "資産管理台帳",
  description: "手入力で収入と支出を管理する個人用台帳",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-950">
        <AppNav />
        {children}
      </body>
    </html>
  );
}
