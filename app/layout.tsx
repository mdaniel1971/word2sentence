import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "word2sentence - Learn Languages Through Context",
  description: "Create sentences from vocabulary words and master languages through AI-powered contextual learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${amiri.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
