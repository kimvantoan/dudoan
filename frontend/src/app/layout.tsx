import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { ClientShell } from "@/components/ClientShell";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "World Cup Predictor - Dự đoán Tỷ số Bóng đá & Tranh tài Nhóm",
  description: "Trực quan hóa dự đoán tỷ số các trận cầu đỉnh cao World Cup, tạo nhóm chơi cùng đồng nghiệp, tích lũy điểm số và thăng hạng trên BXH.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
