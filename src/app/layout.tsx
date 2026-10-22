import type { Metadata, Viewport } from "next";
import { Baloo_2, Baloo_Da_2, Hind_Siliguri, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { LANG_COOKIE, isLanguage } from "@/i18n/config";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-baloo" });
// Bengali cut of the same playful typeface, so বাংলা headings keep the brand look.
const balooDa = Baloo_Da_2({ subsets: ["bengali"], weight: ["500", "600", "700", "800"], variable: "--font-baloo-da" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });
const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind" });

export const metadata: Metadata = {
  title: { default: "Progga AI — the tutor that helps kids think", template: "%s · Progga AI" },
  description:
    "Progga is a safe AI tutor for students from Class 3 to HSC. Instead of handing out answers, it guides students step by step with questions, hints and the 'why' behind every move.",
};

export const viewport: Viewport = { themeColor: "#6C4CF1" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the language on the server so the first paint is already in the right language.
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  const initialLang = isLanguage(saved) ? saved : "en";

  return (
    <html lang={initialLang === "bn" ? "bn" : "en"} className={`${baloo.variable} ${balooDa.variable} ${nunito.variable} ${hind.variable}`}>
      <body>
        <Providers initialLang={initialLang}>{children}</Providers>
      </body>
    </html>
  );
}
