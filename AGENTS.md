# AGENTS.md — SGX Edu-Trader 2.0 Project Rules (100% Google Ecosystem)

## What We're Building
SGX Edu-Trader 2.0 is an institutional-grade, bright-mode Next.js 14 paper trading simulator for Singapore secondary school and junior college students. Students invest S$10,000.00 virtual capital across 20 real SGX-listed Singapore companies with authentic SGX market rules, TradingView candlestick charts, and Socratic Gemini AI coaching.

## Tech Stack — 100% Google Cloud & Approved Libraries (NO Vercel, NO Supabase)
- **Framework:** Next.js 14 App Router with TypeScript and Tailwind CSS
- **Hosting & Compute:** Firebase App Hosting / Google Cloud Run (`apphosting.yaml`)
- **Database & Realtime:** Google Cloud Firestore (`firebase` client `onSnapshot` + `firebase-admin` server transactions)
- **Authentication:** Firebase Authentication / Google Identity Platform with 1-click **Gmail OAuth (`GoogleAuthProvider`)** + HTTP-only `__session` cookie
- **Scheduling:** Google Cloud Scheduler invoking `/api/cron/prices` and `/api/cron/snapshot`
- **AI Engine:** `@google/genai` (`gemini-2.5-flash`)
- **Pro Financial Charts:** TradingView `lightweight-charts` (Candlesticks, Area, Volume histogram, SMA 20/50, VWAP)
- **Market Data:** `yahoo-finance2` with Twelve Data fallback & Firestore cache
- **Google Apps Integration:** 1-click Google Sheets Gradebook Export & Roster Sync

## Design System — "SGX Institutional Daylight" (Bright UI Only)
- **Canvas Background:** `#F8FAFC` (`bg-sgx-canvas`)
- **Elevated Card Surface:** `#FFFFFF` (`bg-sgx-surface`) with `#E2E8F0` border (`border-sgx-border`)
- **Recessed Surface:** `#F1F5F9` (`bg-sgx-subtle`)
- **Primary Ink:** `#0F172A` (`text-sgx-ink`)
- **Secondary Slate:** `#475569` (`text-sgx-slate`)
- **Primary Brand Accent:** `#0052FF` (`sgx-blue`)
- **Bullish / Profit / Bid:** Emerald `#059669` (`sgx-bull`), Text `#047857`, Tint `#ECFDF5`
- **Bearish / Loss / Ask:** Crimson `#E11D48` (`sgx-bear`), Text `#BE123C`, Tint `#FFF1F2`
- **Typography:** `Plus Jakarta Sans` (Headings), `Inter` (Body), `JetBrains Mono` (Tickers/Prices/P&L with `tabular-nums`)
- **Currency Formatting:** ALL currency totals formatted as `S$X,XXX.XX` (and SGX sub-dollar prices formatted to exact SGX tick precision)
- **P&L Indicators:** ALWAYS show `▲` or `▼` symbol AND `"profit"` or `"loss"` text — never rely on colour alone

## Canonical 20 SGX Tickers
- **Safe Bets:** `D05.SI` (DBS Group Holdings), `O39.SI` (OCBC Bank), `U11.SI` (United Overseas Bank), `Z74.SI` (Singtel), `C6L.SI` (Singapore Airlines)
- **Industry Giants:** `BN4.SI` (Keppel Ltd), `U96.SI` (Sembcorp Industries), `S68.SI` (Singapore Exchange), `S58.SI` (SATS Ltd), `S63.SI` (ST Engineering)
- **Everyday Brands:** `C52.SI` (ComfortDelGro), `OV8.SI` (Sheng Siong Group), `BSL.SI` (Raffles Medical Group), `OYY.SI` (PropNex Limited), `S59.SI` (SIA Engineering)
- **High Risk, High Reward:** `AIY.SI` (iFAST Corporation), `MZH.SI` (Nanofilm Technologies), `CHZ.SI` (HRnetGroup Limited), `8AZ.SI` (Aztech Global Ltd), `ITS.SI` (ISOTeam Ltd)

## Required Disclaimer — Present on Every Page Footer
"SGX Edu-Trader is a paper trading simulation for educational purposes only. No real securities transactions are conducted and no real money is involved. Not licensed by the Monetary Authority of Singapore (MAS). Not financial advice under the Financial Advisers Act (Cap. 110) or Securities and Futures Act (Cap. 289) of Singapore. Not affiliated with Singapore Exchange Limited (SGX Group)."
