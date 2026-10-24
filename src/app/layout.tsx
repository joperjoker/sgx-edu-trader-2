import type { Metadata } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/utils/env-check";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OnboardingFlow from "@/components/OnboardingFlow";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SGX Edu-Trader 2.0 · Singapore Exchange Paper Trading Platform",
  description:
    "Institutional daylight paper trading simulator for Singapore students. Powered by Google Cloud, Firebase, TradingView Charts, and Gemini 2.5 Flash.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  validateEnv();
  const user = await getServerSessionUser();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-sgx-canvas font-sans text-sgx-ink antialiased selection:bg-blue-100 selection:text-sgx-blue">
        <Navbar initialUser={user} />
        <OnboardingFlow user={user} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
