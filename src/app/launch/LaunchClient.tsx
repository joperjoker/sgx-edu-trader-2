"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  Layers,
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
  title="${schoolName} — SGX Edu-Trader 2.0"
  width="100%"
  height="${iframeHeight}px"
  style="border: 1px solid #E2E8F0; border-radius: 16px; background: #F8FAFC;"
  allow="clipboard-write; fullscreen"
  allowfullscreen
></iframe>`;

  const powerShellDeployCmd = `.\\scripts\\deploy-google-cloud.ps1 -ProjectId "sgx-edu-trader-2-sg" -Region "asia-southeast1"`;

  const gcloudDirectCmd = `gcloud run deploy sgx-edu-trader --source . --region asia-southeast1 --allow-unauthenticated --memory 1Gi && npx firebase-tools deploy --only firestore,hosting`;

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Hero Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-sgx-blue">
              <Rocket className="h-3.5 w-3.5" />
              100% Google Cloud Run · Firebase Hosting · Google Sites Ready
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Google Sites &amp; Google Cloud Launch Center
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Deploy <strong>{schoolName}</strong> ({semester}) to{" "}
              <strong>Google Cloud Run (`asia-southeast1` Singapore)</strong>{" "}
              and embed the full interactive SGX trading terminal directly inside
              your school&apos;s <strong>Google Site (`sites.google.com`)</strong>{" "}
              or <strong>Google Classroom</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-sgx-blue px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
            >
              Open Live SGX Terminal
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Teacher Console
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
                Cloud Run Standalone Build
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                Dockerfile + apphosting.yaml Ready
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
                Cross-Site HTTPS __session Ready
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5">
            <Layers className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">
                SGX Market &amp; Gemini 2.5 AI
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-emerald-800">
                {tickersCount} SGX Counters Active
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Google Sites Embed Generator (Left 7 cols) + Cloud Run Deploy Commands (Right 5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Google Sites Embed Code Generator */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-sgx-blue">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Google Sites Full-Page Embed Generator
                </h2>
                <p className="text-xs text-slate-500">
                  Generate the exact URL or HTML snippet to paste into{" "}
                  <code className="font-mono text-slate-700">
                    sites.google.com
                  </code>{" "}
                  (Insert → Embed)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Your Firebase / Cloud Run Production URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://sgx-edu-trader-sg.web.app"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:border-sgx-blue focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Default Starting Page
              </label>
              <select
                aria-label="Default Starting Page"
                value={landingPath}
                onChange={(e) => setLandingPath(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-sgx-blue focus:bg-white focus:outline-none"
              >
                <option value="/dashboard">Market Screener (/dashboard)</option>
                <option value="/login">Gmail Sign-In (/login)</option>
                <option value="/leaderboard">
                  Class Leaderboard (/leaderboard)
                </option>
                <option value="/company/D05.SI">
                  DBS Pro Chart (/company/D05.SI)
                </option>
              </select>
            </div>
          </div>

          {/* Option A: Direct URL for Google Sites "By URL" */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Option A: Google Sites &quot;Embed → By URL&quot; (Recommended
                Full-Page View)
              </span>
              <button
                type="button"
                onClick={() => copyText("url", fullEmbedUrl)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                {copiedKey === "url" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied URL
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-sgx-blue select-all">
              {fullEmbedUrl}
            </p>
          </div>

          {/* Option B: Google Sites "Embed Code" Iframe Snippet */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-sgx-blue" />
                <span className="text-xs font-bold text-slate-900">
                  Option B: Google Sites &quot;Embed → Embed Code&quot;
                  (&lt;iframe&gt;)
                </span>
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
                      Copied HTML
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

          {/* Active Classroom Join Codes */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
            <p className="text-xs font-bold text-slate-900">
              Active Classroom Join Codes to Share on Your Google Site
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {classCodes.map((c) => (
                <div
                  key={c.code}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs shadow-sm"
                >
                  <span className="font-semibold text-slate-700">{c.name}:</span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 font-mono font-extrabold text-sgx-blue">
                    {c.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right 5 Cols: 3-Step Google Cloud + Google Sites Launch Guide */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 lg:col-span-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                3-Step Live Launch Guide
              </h2>
              <p className="text-xs text-slate-500">
                Push to Google Cloud Run (Singapore) &amp; publish on Google
                Sites
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                    1
                  </span>
                  Deploy to Google Cloud Run &amp; Firebase
                </span>
                <button
                  type="button"
                  onClick={() => copyText("ps1", powerShellDeployCmd)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-sgx-blue hover:bg-blue-50"
                >
                  {copiedKey === "ps1" ? "Copied!" : "Copy PowerShell"}
                </button>
              </div>
              <p className="text-slate-600">
                Run the included 1-click PowerShell deployment script from your
                project root:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                {powerShellDeployCmd}
              </pre>
              <p className="text-[11px] text-slate-500">
                Or deploy directly with Google Cloud CLI:
              </p>
              <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-slate-200">
                {gcloudDirectCmd}
              </pre>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                  2
                </span>
                Authorize Domain in Firebase Auth
              </span>
              <p className="text-slate-600 leading-relaxed">
                In the{" "}
                <strong>
                  Firebase Console → Authentication → Settings → Authorized
                  domains
                </strong>
                , ensure your <code className="font-mono">*.web.app</code>,{" "}
                <code className="font-mono">*.run.app</code>, and{" "}
                <code className="font-mono">sites.google.com</code> domains are
                listed so 1-click Gmail OAuth popups succeed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5">
              <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sgx-blue font-mono text-xs text-white">
                  3
                </span>
                Embed &amp; Publish on Google Sites
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
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
                  and create or open your class portal.
                </li>
                <li>
                  Click <strong>Insert → Full page embed</strong> (or{" "}
                  <strong>Insert → Embed</strong>).
                </li>
                <li>
                  Paste the <strong>Option A URL</strong> or{" "}
                  <strong>Option B &lt;iframe&gt;</strong> code from the left
                  panel.
                </li>
                <li>
                  Click <strong>Publish</strong> in the top-right corner of
                  Google Sites to launch live for your students!
                </li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
