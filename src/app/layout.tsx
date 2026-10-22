import type { Metadata, Viewport } from "next";
import { Baloo_2, Hind_Siliguri, Nunito } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });
const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind" });

export const metadata: Metadata = {
  title: { default: "Progga AI — the tutor that helps kids think", template: "%s · Progga AI" },
  description:
    "Progga is a safe AI tutor for students from Class 3 to HSC. Instead of handing out answers, it guides students step by step with questions, hints and the 'why' behind every move.",
};

export const viewport: Viewport = { themeColor: "#6C4CF1" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} ${hind.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
