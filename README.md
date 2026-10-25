# EduFinLit · Student Growth & SGX Market Simulator 🇸🇬📈

<p align="center">
  <img src="public/efl-logo.png" alt="EduFinLit Crest Logo" width="96" height="96" />
</p>

**An institutional-grade, 100% Google Cloud & Bright Daylight financial literacy and SGX Market paper trading simulator for Singapore secondary school and junior college students.**

- 🌐 **Live Hosted URL (Google Firebase Hosting):** **[https://sgx-edu-trader-2-sg.web.app](https://sgx-edu-trader-2-sg.web.app)**
- 📖 **Handbooks & Video Walkthrough Studio:** **[https://sgx-edu-trader-2-sg.web.app/handbook](https://sgx-edu-trader-2-sg.web.app/handbook)**
- 🤖 **Agentic AI Copilot Workspace:** **[https://sgx-edu-trader-2-sg.web.app/copilot](https://sgx-edu-trader-2-sg.web.app/copilot)**
- 🏫 **Google Sites Direct Embed URL:** `https://sgx-edu-trader-2-sg.web.app/dashboard`
- 🚀 **Launch & Google Sites Embed Center:** **[https://sgx-edu-trader-2-sg.web.app/launch](https://sgx-edu-trader-2-sg.web.app/launch)**

Students manage **S$10,000.00** in virtual SGD capital across **20 real Singapore Exchange (SGX) listed companies**, learning authentic SGX Market rules, 100-share Board Lots, Bid/Ask order book depth, transaction fee math (Brokerage + CDP Clearing + SGX Trading Fee + 9% GST), portfolio diversification (`1 − HHI`), and Socratic financial reasoning powered by **Google Cloud & Gemini**.

---

## ✨ Key Highlights

### 1. Agentic AI Copilot (`/copilot`) + Multi-Turn Gemini LLM Harness
- **14 Deterministic SGX Action Tools + Multi-Turn LLM Synthesis (`enrichCopilotTurnWithGemini`):**
  - Combines exact, zero-hallucination SGX financial math (`0.28162%` fees, `S$10.00` minimum brokerage, SGX minimum tick table, Herfindahl-Hirschman Index `HHI`, and Smart Investor Score) with multi-turn **Google Cloud & Gemini** Socratic coaching grounded in the student's live portfolio holdings and the last 6 conversation turns.
- **Interactive Staged Order Tickets with Inline Lot Adjuster:**
  - Ask in natural language (*"Buy 1 lot of DBS"*, *"Buy 2 lots of Sheng Siong"*, *"Limit buy 100 shares of Singtel at S$4.05"*).
  - Adjust orders inline (`Switch to SELL / BUY`, `− 1 Lot (100 sh)`, `+ 1 Lot (100 sh)`) and see real-time updates to SGX/CDP/GST fees, post-trade cash, and Diversification (`1 − HHI`) before clicking **Confirm & Execute SGX Order**.
- **What-If Simulator, Multi-Stock Comparator, DRIP Projector & Open-Ended Socratic Q&A (`socratic_qa`):**
  - Run What-If diversification previews, side-by-side SGX stock comparisons, 5-year Dividend Reinvestment Plan (DRIP) compounding projections, 4-scenario macroeconomic stress tests, weekly reflection co-writing, and open-ended portfolio strategy Q&A.
- **EduFinLit Socratic Learning Guardrails:**
  - **Anti-Speculation & Financial Advice Refusal:** Automatically intercepts stock-picking or price-prediction prompts (*"Which stock will go up tomorrow?"*) and pivots to a 3-question Socratic evaluation framework.
  - **Mandatory 2-Step Order Confirmation:** Never executes a trade silently without student confirmation on an itemized order ticket.
  - **Small-Order Fee-Drag Alert:** Warns students whenever minimum brokerage fees exceed `1.5%` of trade value.
  - **Role-Based Classroom Controls:** Restricts teacher commands (Odd-Lot toggle, Fee Mode toggle, Quarterly Dividend distribution, Gradebook CSV export) to `teacher` and `superadmin` accounts.

### 2. "Institutional Daylight" Bright UI System & Cross-App Deep Links
- High-contrast, classroom-legible interface (`#F8FAFC` canvas, `#FFFFFF` cards, `#0F172A` slate ink, `#0052FF` cobalt accent) featuring the **EduFinLit** crest logo (`/efl-logo.png`).
- Accessible P&L indicators: every price change and portfolio return displays both `▲`/`▼` directional symbols **and** explicit `"profit"`/`"loss"` labels using `JetBrains Mono` (`tabular-nums`).
- **Bidirectional AI Copilot Deep-Links:** 1-click deep links connect the **SGX Market Screener** (`/dashboard`), **Company Pro Terminal** (`/company/[ticker]`), **My Portfolio & Reflection Journal** (`/portfolio`), and **Leaderboard** (`/leaderboard`) directly into `/copilot?prompt=...`.

### 3. Authentic SGX Market Microstructure & Pro Charting
- **TradingView `lightweight-charts` Pro Terminal:** Interactive Candlestick & Mountain Area modes, Volume histogram, `1D`/`5D`/`1M`/`6M`/`1Y` timeframes, `SMA 20`, `SMA 50`, `VWAP`, `RSI (14)` momentum indicator, `vs STI Benchmark` overlay, and live OHLCV crosshair readout.
- **Official SGX Minimum Tick Size Table:**
  - Below `S$0.20`: **`S$0.001`** (e.g., `ITS.SI` ISOTeam)
  - `S$0.20` to `S$0.995`: **`S$0.005`** (e.g., `S59.SI`, `CHZ.SI`, `8AZ.SI`)
  - `S$1.00` and above: **`S$0.01`** (e.g., `D05.SI` DBS Group, `O39.SI` OCBC, `U11.SI` UOB)
- **SGX Board Lots & 5-Level Order Book Depth:** Standard `100`-share SGX board lots (with Teacher toggle for `1`-share Odd-Lot beginner mode), live 5-level Bid/Ask Order Book ladder, Market & Limit orders with automatic price-improvement matching, and printable **Official SGX `T+2` Electronic Contract Notes**.
- **Authentic SGX + CDP + 9% GST Fee Engine:**
  - Brokerage Commission: `0.20%` of contract value (Minimum `S$10.00`)
  - CDP Clearing Fee: `0.0325%`
  - SGX Trading Access Fee: `0.0075%`
  - Singapore GST: `9%` on total fees (effective `0.28162%`, or Teacher toggle for simplified `S$10.00` flat classroom fee)
- **Official SGT Exchange Session State Machine:** Models Pre-Open (`08:30–08:59`), Morning Continuous Session (`09:00–12:00`), Midday Intermission (`12:00–13:00`), Afternoon Continuous Session (`13:00–17:00`), Closing Auction (`17:00–17:06`), weekends, and official Singapore Public Holidays.

### 5. Role-Based Handbooks & 6-Episode Playable Video Walkthrough Studio (`/handbook`)
- **Interactive Video Walkthrough Player:**
  - High-fidelity simulated visual screen cues animating live order tickets, TradingView candlesticks, Level 2 depth books, AI chat turns, 5-Pillar radars, and Google Sites embeds in sync with elapsed time.
  - Web Speech voiceover audio narration with live toggle, audio waveform, closed captions (CC), playback speed adjustments (`1x`, `1.25x`, `1.5x`, `2x`), and scrubbable chapter markers.
  - Dual view modes: **Interactive Video Player** and **Full 3-Column Production Script & Storyboard** (`Timestamp & Screen Cue` | `On-Screen Kinetic Callout` | `Creator Voiceover Script`) with 1-click script copying.
- **Role-Based Handbooks with 1-Click Print & PDF Export:**
  - **Student Field Handbook:** SGX board lots, tick size schedules, fee-drag formulas, 1 − HHI diversification math, DRIP snowball compounding, and pre-trade hypothesis tagging.
  - **Teacher & HOD Implementation Manual:** 3-minute zero-prep classroom onboarding, SGX market controls, 5-Pillar Cognitive Science Rubrics (FL-C1 to FL-C5), Biggs' SOLO Taxonomy mastery matrix, automated formative report card comments, and 1-click Google Sheets Gradebook export.
  - **Superadmin & School IT Operations Manual:** 100% Google Cloud architecture, Google Sites embed codes (Option A & B), Chromebook SameSite cookie troubleshooting, and Cloud Scheduler crons.
  - **1-Click Actions:** Print / Save as PDF (`@media print` optimized for clean classroom whitepapers) and 1-click Markdown download.

---

### 4. 100% Google Cloud Ecosystem (Zero Vercel, Zero Supabase)
- **Hosting & Compute:** Google Cloud Run (`asia-southeast1` Singapore) + Firebase Hosting (`apphosting.yaml`, `Dockerfile`, `cloudbuild.yaml`, `firebase.json`).
- **Database:** Google Cloud Firestore (`firestore.rules`, `firestore.indexes.json`) with automatic local JSON emulator sync (`.data/firestore-local.json`) for instant zero-config classroom testing.
- **Authentication:** Firebase Authentication with 1-click **Continue with Google (Gmail)** OAuth (`GoogleAuthProvider`), HTTP-only `__session` SSR cookies, and 1-click Google Classroom Sandbox accounts.
- **Google Workspace & Google Sites Integration:**
  - 1-click **Google Sheets Gradebook CSV Export** & **CSV/TSV Class Roster Sync**.
  - Native **Google Sites (`sites.google.com`) Full-Page Embed** support via `Content-Security-Policy: frame-ancestors` headers and the built-in `/launch` Embed Code Generator with pre-launch readiness checks.

---

## 🏢 Canonical 20 SGX Companies Across 4 Risk Tiers

| Risk Tier | SGX Tickers |
| :--- | :--- |
| **🟢 Safe Bets (Blue-Chip Anchors)** | `D05.SI` (DBS Group), `O39.SI` (OCBC Bank), `U11.SI` (UOB), `Z74.SI` (Singtel), `C6L.SI` (Singapore Airlines) |
| **🔵 Industry Giants (Core Infrastructure)** | `BN4.SI` (Keppel Ltd), `U96.SI` (Sembcorp Industries), `S68.SI` (SGX Group), `S58.SI` (SATS Ltd), `S63.SI` (ST Engineering) |
| **🟣 Everyday Brands (Domestic Consumer & Services)** | `C52.SI` (ComfortDelGro), `OV8.SI` (Sheng Siong), `BSL.SI` (Raffles Medical), `OYY.SI` (PropNex), `S59.SI` (SIA Engineering) |
| **🟠 High Risk, High Reward (Growth & Cyclicals)** | `AIY.SI` (iFAST Corp), `MZH.SI` (Nanofilm Tech), `CHZ.SI` (HRnetGroup), `8AZ.SI` (Aztech Global), `ITS.SI` (ISOTeam) |

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template (optional — works out of the box with local Firestore mirror!)
cp .env.example .env.local

# 3. Start the Next.js development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser:
- Click **Continue with Google (Gmail)** when Firebase client keys are configured, **OR**
- Use the **1-Click Google Classroom Sandbox** buttons on `/login`:
  - **Student:** `student1@gmail.com` (Class `SGX4E1`)
  - **Teacher (HOD):** `teacher@sgxedu.sg`
  - **Superadmin:** `admin@sgxedu.sg`

---

## 🧪 Automated QA & UAT Verification Suite (39 Test Suites)

Run the complete static analysis, production build, and **39-suite automated + live HTTP/SSR UAT runner** ([`scripts/run-uat-qa.ts`](scripts/run-uat-qa.ts)):

```bash
npm run typecheck
npm run lint
npm run build
npx tsx scripts/run-uat-qa.ts
```

---

## ☁️ Deploying to Google Cloud & Embedding in Google Sites

1. **Build & Deploy to Firebase Hosting (`sgx-edu-trader-2-sg.web.app`):**
   ```bash
   node scripts/build-firebase-hosting.mjs
   npx firebase-tools deploy --only hosting --project sgx-edu-trader-2-sg
   ```
2. **Deploy Full Container to Google Cloud Run (`asia-southeast1` Singapore):**
   ```powershell
   .\scripts\deploy-google-cloud.ps1 -ProjectId "sgx-edu-trader-2-sg" -Region "asia-southeast1"
   ```
3. **Embed in Google Sites (`sites.google.com`):**
   - Navigate to `/launch` inside the app.
   - Copy the **Option A Direct Embed URL** or **Option B `<iframe ...>` Embed Code**.
   - In Google Sites, click **Insert → Embed → By URL (or Embed code)**, paste, and click **Publish**.

---

## ⚖️ Regulatory & Educational Disclaimer

> EduFinLit is a paper trading simulation for educational purposes only. No real securities transactions are conducted and no real money is involved. Not licensed by the Monetary Authority of Singapore (MAS). Not financial advice under the Financial Advisers Act (Cap. 110) or Securities and Futures Act (Cap. 289) of Singapore. Not affiliated with Singapore Exchange Limited (SGX Group).
