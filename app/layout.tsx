import type { Metadata } from "next";
import { Cormorant_Garamond, Rufina } from "next/font/google";
import "./globals.css";

const body = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const display = Rufina({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SPMB - Sistem Penerimaan Murid Baru",
  description: "Sistem Penerimaan Murid Baru SMA Citra Negara",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${body.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
