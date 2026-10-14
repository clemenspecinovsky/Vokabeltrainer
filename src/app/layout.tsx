import type { Metadata, Viewport } from "next";
import { Baloo_2, Bangers } from "next/font/google";
import "./globals.css";

const display = Bangers({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const body = Baloo_2({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Vokabel-Trainer",
  description: "Comic Vokabel-Trainer für Kinder: lernen und testen auf Deutsch und Englisch.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffd23f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
