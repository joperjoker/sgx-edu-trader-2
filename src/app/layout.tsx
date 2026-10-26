import type { Metadata, Viewport } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/utils/env-check";
import { getServerSessionUser } from "@/lib/firebase/auth-session";
import Navbar from "@/components/Navbar";
import ClassroomPersonaBanner from "@/components/ClassroomPersonaBanner";
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

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sgx-edu-trader-2-sg.web.app"),
  title: "EduFinLit · Student Growth & SGX Market Simulator",
  description:
    "Institutional daylight financial literacy and SGX Market paper trading simulator for Singapore secondary school and junior college students. Powered by Google Cloud, Firebase, TradingView Charts, and Gemini.",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/efl-logo.png",
    apple: "/efl-logo.png",
  },
  openGraph: {
    title: "EduFinLit · Student Growth & SGX Market Simulator 🇸🇬📈",
    description:
      "Institutional daylight paper trading simulator for Singapore students. S$10,000 virtual capital, 20 SGX blue-chips, authentic board lots, fee drag math, and Socratic Gemini AI coaching.",
    url: "https://sgx-edu-trader-2-sg.web.app",
    siteName: "EduFinLit",
    images: [
      {
        url: "/efl-logo.png",
        width: 800,
        height: 800,
        alt: "EduFinLit Crest Logo & Singapore Financial Literacy",
      },
    ],
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduFinLit · Student Growth & SGX Market Simulator 🇸🇬📈",
    description:
      "Institutional daylight paper trading simulator for Singapore students. S$10,000 virtual capital, 20 SGX blue-chips, authentic board lots, fee drag math, and Socratic Gemini AI coaching.",
    images: ["/efl-logo.png"],
  },
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
        <ClassroomPersonaBanner initialUser={user} />
        <OnboardingFlow user={user} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
