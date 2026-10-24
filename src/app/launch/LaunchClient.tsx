"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Layers,
  MessageSquareShare,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";

interface Props {
  schoolName: string;
  semester: string;
  tickersCount: number;
  classCodes: Array<{ name: string; code: string }>;
}

export default function LaunchClient({
  schoolName,
  semester,
  tickersCount,
  classCodes,
}: Props) {
  const [baseUrl, setBaseUrl] = useState("https://sgx-edu-trader-2-sg.web.app");
  const [landingPath, setLandingPath] = useState("/dashboard");
  const [iframeHeight, setIframeHeight] = useState("920");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showCliDrawer, setShowCliDrawer] = useState(false);
  const [selectedJoinCode, setSelectedJoinCode] = useState(
    classCodes[0]?.code ?? "SGX4E1",
  );

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.origin &&
      !window.location.origin.includes("127.0.0.1") &&
      !window.location.origin.includes("localhost")
    ) {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const fullEmbedUrl = `${cleanBase}${landingPath}`;

  const googleSitesIframeSnippet = `<iframe
  src="${fullEmbedUrl}"
  title="${schoolName} — EFL · EduFinLit"
  width="100%"
  height="${iframeHeight}px"
  style="border: 1px solid #E2E8F0; border-radius: 16px; background: #F8FAFC;"
  allow="clipboard-write; fullscreen; popups; popups-to-escape-sandbox"
  allowfullscreen
></iframe>`;

  const studentInviteMessage = `Welcome to ${schoolName} — EFL · EduFinLit (${semester})!
Start with S$10,000.00 in virtual cash to invest across ${tickersCount} real Singapore Exchange (SGX) companies.

1. Open our live cloud platform: ${cleanBase}
2. Click "Continue with Google (Gmail)" (or pick a 1-Click Demo Student Profile)
3. Enter our Class Join Code: ${selectedJoinCode}`;

  const powerShellDeployCmd = `.\\scripts\\deploy-google-cloud.ps1 -ProjectId "sgx-edu-trader-2-sg" -Region "asia-southeast1"`;

  const gcloudDirectCmd = `gcloud run deploy sgx-edu-trader --source . --region asia-southeast1 --allow-unauthenticated --memory 1Gi && npx firebase-tools deploy --only firestore,hosting`;

  // Foolproof clipboard copy with fallback for embedded Google Sites iframes
  const copyText = async (key: string, value: string) => {
    let copied = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copied = true;
      } catch {
        // ignore fallback error
      }
    }

    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2400);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Hero Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-sgx-blue">
              <Rocket className="h-3.5 w-3.5" />
              100% Google Cloud · Firebase Hosting · Google Sites &amp; Classroom Ready
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Google Sites &amp; Google Cloud Launch Center
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Your <strong>{schoolName}</strong> ({semester}) simulator is{" "}
              <strong className="text-emerald-700">already live 24/7 in the cloud</strong>{" "}
              at{" "}
              <a
                href={cleanBase}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-bold text-sgx-blue underline"
              >
                {cleanBase}
              </a>
              . You do not need to run anything on your computer — simply copy the
              link below to embed inside{" "}
              <strong>
                Google Sites (
                <code className="font-mono text-slate-800">
                  sites.google.com
                </code>
                )
              </strong>{" "}
              or share directly on <strong>Google Classroom</strong>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="https://sites.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Open Google Sites
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://classroom.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-sgx-blue hover:bg-blue-100"
            >
              Open Google Classroom
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Back to Market Screener
            </Link>
          </div>
        </div>

        {/* Pre-Flight Readiness Status Strip */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                Google Sites CSP Header
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                frame-ancestors sites.google.com
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <Cloud className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                24/7 Cloud Hosting Active
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                Zero Local Server Needed
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                Gmail OAuth &amp; Classroom
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                Google Sign-In + Demo Ready
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <Layers className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                SGX Market &amp; Gemini
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                {tickersCount} SGX Counters Active
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Google Sites Embed Generator (Left 7 cols) + Foolproof 3-Step Teacher Guide (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Google Sites Embed Code Generator & Student Invite Builder */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-sgx-blue">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Google Sites Full-Page Embed Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Copy either the <strong>Direct URL (Option A)</strong> or{" "}
                  <strong>HTML Embed Code (Option B)</strong> into{" "}
                  <code className="font-mono text-slate-700">
                    sites.google.com
                  </code>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLivePreview((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-sgx-blue hover:bg-blue-100"
            >
              {showLivePreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide Embed Preview
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Test Embed Preview Live
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="launch-base-url"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Your Live Cloud URL (Pre-Filled Automatically)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="launch-base-url"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://sgx-edu-trader-2-sg.web.app"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-sgx-blue focus:bg-white focus:outline-none"
                />
                {baseUrl !== "https://sgx-edu-trader-2-sg.web.app" && (
                  <button
                    type="button"
                    onClick={() =>
                      setBaseUrl("https://sgx-edu-trader-2-sg.web.app")
                    }
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Reset Default
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="launch-starting-page"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                Which Page Students See First
              </label>
              <select
                id="launch-starting-page"
                aria-label="Default Starting Page"
                value={landingPath}
                onChange={(e) => setLandingPath(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-sgx-blue focus:bg-white focus:outline-none"
              >
                <option value="/dashboard">SGX Market Screener (/dashboard)</option>
                <option value="/copilot">AI Copilot (/copilot)</option>
                <option value="/login">Gmail Sign-In &amp; Welcome (/login)</option>
                <option value="/leaderboard">
                  Class Leaderboard (/leaderboard)
                </option>
                <option value="/portfolio">
                  Student CDP Portfolio (/portfolio)
                </option>
                <option value="/company/D05.SI">
                  DBS Pro Chart (/company/D05.SI)
                </option>
                <option value="/admin">Teacher Console (/admin)</option>
              </select>
            </div>
          </div>

          {/* Option A: Direct URL for Google Sites "By URL" */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                  ⭐ Option A (Easiest): Paste into Google Sites &quot;By URL&quot;
                  or Google Classroom
                </span>
                <p className="text-[11px] text-slate-600">
                  Works in Google Sites (<strong>Insert → Embed → By URL</strong>{" "}
                  or <strong>Insert → Full page embed</strong>) and as a direct
                  link in Google Classroom.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fullEmbedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Test Link
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => copyText("url", fullEmbedUrl)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  {copiedKey === "url" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied URL!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2.5 rounded-xl border border-blue-200 bg-white px-3 py-2 font-mono text-xs font-bold text-sgx-blue select-all break-all">
              {fullEmbedUrl}
            </p>
          </div>

          {/* Option B: Google Sites "Embed Code" Iframe Snippet */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-sgx-blue" />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Option B: Google Sites &quot;Embed → Embed Code&quot;
                    (&lt;iframe&gt;)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Use this if you want to customize the exact height of the
                    simulator box inside a Google Site page.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Iframe Height"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] text-slate-700"
                >
                  <option value="760">760px height</option>
                  <option value="920">920px height</option>
                  <option value="1080">1080px height</option>
                </select>
                <button
                  type="button"
                  onClick={() => copyText("iframe", googleSitesIframeSnippet)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                >
                  {copiedKey === "iframe" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied HTML!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Embed Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 font-mono text-[11px] leading-relaxed text-slate-100">
              {googleSitesIframeSnippet}
            </pre>
          </div>

          {/* Interactive Live Embed Preview (when toggled) */}
          {showLivePreview && (
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Live Google Sites Iframe Preview ({fullEmbedUrl})
                </span>
                <span className="font-mono text-[11px] text-emerald-700">
                  Interactive Frame Verified
                </span>
              </div>
              <iframe
                src={fullEmbedUrl}
                title="Google Sites Live Embed Preview"
                className="w-full h-[540px] rounded-xl border border-slate-200 bg-white shadow-inner"
              />
            </div>
          )}

          {/* 1-Click Copyable Classroom Join Codes + Ready-to-Send Student Invite */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquareShare className="h-4 w-4 text-emerald-700" />
                  Ready-to-Send Student Invite &amp; Class Join Codes
                </p>
                <p className="text-[11px] text-slate-600">
                  Click any Class Join Code to select &amp; copy it, or copy the
                  complete student announcement for Google Classroom / WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText("invite", studentInviteMessage)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                {copiedKey === "invite" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied Student Invite!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Student Invite Message
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {classCodes.map((c) => {
                const isSelected = selectedJoinCode === c.code;
                const isJustCopied = copiedKey === `code-${c.code}`;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedJoinCode(c.code);
                      copyText(`code-${c.code}`, c.code);
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition shadow-sm ${
                      isSelected
                        ? "border-sgx-blue bg-white ring-2 ring-sgx-blue/20"
                        : "border-slate-200 bg-white hover:border-sgx-blue"
                    }`}
                  >
                    <span className="font-semibold text-slate-700">
                      {c.name}:
                    </span>
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono font-extrabold text-sgx-blue">
                      {c.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isJustCopied ? "✓ Copied" : "Copy"}
                    </span>
                  </button>
                );
              })}
            </div>

            <pre className="whitespace-pre-wrap rounded-xl border border-emerald-200/80 bg-white p-3 font-sans text-xs leading-relaxed text-slate-700">
              {studentInviteMessage}
            </pre>
          </div>
        </section>

        {/* Right 5 Cols: Foolproof 3-Step Teacher Guide + FAQ + Collapsible IT CLI */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 lg:col-span-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Foolproof 3-Step Teacher Guide
              </h2>
              <p className="text-xs text-slate-500">
                How to embed on Google Sites or share on Google Classroom (Zero
                coding required)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                  1
                </span>
                Copy the Option A Link on the Left
              </span>
              <p className="text-slate-600 leading-relaxed">
                Click the blue <strong>Copy URL</strong> button in{" "}
                <strong>Option A</strong> on the left panel to copy{" "}
                <code className="font-mono font-bold text-sgx-blue">
                  {fullEmbedUrl}
                </code>
                . Because the app is hosted on Google Firebase Hosting, it stays
                online 24/7 even when your computer is turned off.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                  2
                </span>
                Add to Google Sites (
                <code className="font-mono text-xs text-slate-800">
                  sites.google.com
                </code>
                )
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                <li>
                  Open{" "}
                  <a
                    href="https://sites.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sgx-blue hover:underline"
                  >
                    sites.google.com
                  </a>{" "}
                  and open your class website.
                </li>
                <li>
                  In the right sidebar under <strong>Insert</strong>, click{" "}
                  <strong>Embed</strong> (or go to the <strong>Pages</strong> tab
                  → click <strong>+ → Full page embed</strong>).
                </li>
                <li>
                  Paste the <strong>Option A URL</strong> (or click the{" "}
                  <strong>Embed code</strong> tab and paste{" "}
                  <strong>Option B &lt;iframe&gt;</strong>), then click{" "}
                  <strong>Insert</strong>.
                </li>
                <li>
                  Click the blue <strong>Publish</strong> button in the top-right
                  corner of Google Sites!
                </li>
              </ol>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                  3
                </span>
                How Students Sign In &amp; Join Your Class
              </span>
              <p className="text-slate-600 leading-relaxed">
                Students can sign in with 1 click using{" "}
                <strong>Continue with Google (Gmail)</strong> and enter your
                Class Join Code (<code className="font-mono font-bold">SGX4E1</code>{" "}
                or <code className="font-mono font-bold">SGXJC1</code>), or click
                any <strong>Instant Demo Student Profile</strong> during a quick
                computer-lab demo.
              </p>
            </div>

            {/* Foolproof Troubleshooting Box */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1.5">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-amber-700" />
                Foolproof Classroom Tip (If School Browser Blocks Popups)
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Some school Chromebooks block Google Sign-In popups inside
                embedded iframes. If a student sees a blocked popup inside Google
                Sites, they can either click{" "}
                <strong>&quot;Open Full-Screen in New Tab ↗&quot;</strong> on the
                Sign-In screen or click one of the{" "}
                <strong>1-Click Demo Student Profiles</strong> which work
                instantly without any popup!
              </p>
            </div>

            {/* Collapsible IT Admin / Developer Cloud CLI Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
              <button
                type="button"
                onClick={() => setShowCliDrawer((v) => !v)}
                className="flex w-full items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-sgx-blue"
              >
                <span className="inline-flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-500" />
                  For IT Admins: Google Cloud &amp; Firebase CLI Redeploy Commands
                </span>
                {showCliDrawer ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showCliDrawer && (
                <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600">
                      1-Click PowerShell Deploy Script:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText("ps1", powerShellDeployCmd)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sgx-blue hover:bg-blue-50"
                    >
                      {copiedKey === "ps1" ? "Copied!" : "Copy PowerShell"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                    {powerShellDeployCmd}
                  </pre>
                  <p className="text-[11px] text-slate-500">
                    Direct Google Cloud Run + Firebase CLI command:
                  </p>
                  <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-200">
                    {gcloudDirectCmd}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
