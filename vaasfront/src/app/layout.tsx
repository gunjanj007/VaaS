import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const roboto_mono = Roboto_Mono({ subsets: ["latin"], variable: '--font-roboto-mono' });

export const metadata: Metadata = {
  title: "VaaS - Vibe as a Service",
  description: "Materialize any vibe into a portable aesthetic for generative AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${roboto_mono.variable}`}>{children}</body>
    </html>
  );
}