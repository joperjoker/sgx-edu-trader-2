# SGX Edu-Trader 2.0 (v3.0 Institutional Edition) 🇸🇬📈

**An institutional-grade, 100% Google Cloud & Bright Daylight paper trading simulator for Singapore secondary school and junior college students.**

Students manage **S$10,000.00** in virtual SGD capital across **20 real Singapore Exchange (SGX) listed companies**, learning authentic SGX market rules, board lots, Bid/Ask order book depth, transaction fee math (Brokerage + CDP Clearing + SGX Trading Fee + 9% GST), portfolio diversification, and Socratic financial reasoning powered by **Google Gemini 2.5 Flash**.

---

## ✨ Key Highlights

### 1. "SGX Institutional Daylight" Bright UI System
- High-contrast, sunlight-legible classroom interface (`#F8FAFC` canvas, `#FFFFFF` cards, `#0F172A` slate ink, `#0052FF` SGX Cobalt accent).
- Accessible P&L indicators: every price change and portfolio return displays both `▲`/`▼` directional symbols **and** explicit `"profit"`/`"loss"` labels using `JetBrains Mono` (`tabular-nums`).
- Real-time Navbar cash and net-worth updates with automatic outside-click and route-change menu dismissal.

### 2. Authentic SGX Securities Microstructure & Pro Charting
- **TradingView `lightweight-charts` Pro Terminal:** Interactive Candlestick & Mountain Area modes, Volume histogram, `1D`/`5D`/`1M`/`6M`/`1Y` timeframes, `SMA 20`, `SMA 50`, `VWAP`, `RSI (14)` momentum indicator, `vs STI Benchmark` overlay, and live OHLCV crosshair readout.
- **Official SGX Minimum Tick Size Table:**
  - Below `S$0.20`: **`S$0.001`** (e.g., `ITS.SI` ISOTeam)
  - `S$0.20` to `S$0.995`: **`S$0.005`** (e.g., `S59.SI`, `CHZ.SI`, `8AZ.SI`)
  - `S$1.00` and above: **`S$0.01`** (e.g., `D05.SI` DBS Group, `O39.SI` OCBC, `U11.SI` UOB)
- **SGX Board Lots & 5-Level Order Book Depth:** Standard `100`-share SGX board lots (with Teacher toggle for `1`-share Odd-Lot beginner mode), live 5-level Bid/Ask Order Book ladder, Market & Limit orders with automatic price-improvement matching, and printable **Official SGX `T+2` Electronic Contract Notes**.
- **Authentic SGX + CDP + 9% GST Fee Engine:**
  - Brokerage Commission: `0.08%` of contract value (Minimum `S$10.00`)
  - CDP Clearing Fee: `0.0325%`
  - SGX Trading Access Fee: `0.0075%`
  - Singapore GST: `9%` on total fees (or Teacher toggle for simplified `S$10.00` flat classroom fee)
- **Official SGT Exchange Session State Machine:** Models Pre-Open (`08:30–08:59`), Morning Continuous Session (`09:00–12:00`), Midday Intermission (`12:00–13:00`), Afternoon Continuous Session (`13:00–17:00`), Closing Auction (`17:00–17:06`), weekends, and official Singapore Public Holidays.

### 3. 100% Google Ecosystem (Zero Vercel, Zero Supabase)
- **Hosting & Compute:** Google Cloud Run (`asia-southeast1` Singapore) + Firebase App Hosting (`apphosting.yaml`, `Dockerfile`, `cloudbuild.yaml`, `firebase.json`).
- **Database:** Google Cloud Firestore (`firestore.rules`, `firestore.indexes.json`) with automatic local JSON emulator sync (`.data/firestore-local.json`) for instant zero-config local classroom testing.
- **Authentication:** Firebase Authentication with 1-click **Continue with Google (Gmail)** OAuth (`GoogleAuthProvider`), HTTP-only `__session` SSR cookies, and 1-click Google Classroom Sandbox accounts.
- **Socratic AI Coach:** `@google/genai` (`gemini-2.5-flash`) powering Company News Briefs, 30-Session Price Pattern Analysis, Fundamental Health Ratings, and a **4-Scenario Macroeconomic Portfolio Stress-Tester**.
- **Google Workspace & Google Sites Integration:**
  - 1-click **Google Sheets Gradebook CSV Export** & **CSV/TSV Class Roster Sync**.
  - Native **Google Sites (`sites.google.com`) Full-Page Embed** support via `Content-Security-Policy: frame-ancestors` headers and the built-in `/launch` Embed Code Generator.

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

## 🧪 Automated QA & UAT Verification Suite (30 Test Suites)

Run the complete static analysis, production build, and 30-suite automated + live HTTP/SSR UAT runner:

```bash
npm run typecheck
npm run lint
npm run build
npm run uat
```

---

## ☁️ Deploying to Google Cloud Run & Embedding in Google Sites

1. **Deploy to Google Cloud Run (`asia-southeast1` Singapore) & Firebase Hosting:**
   ```powershell
   .\scripts\deploy-google-cloud.ps1 -ProjectId "your-gcp-project-id" -Region "asia-southeast1"
   ```
2. **Embed in Google Sites (`sites.google.com`):**
   - Navigate to `/launch` inside the app.
   - Copy the **Option A Direct Embed URL** or **Option B `<iframe ...>` Embed Code**.
   - In Google Sites, click **Insert → Full page embed**, paste your URL/code, and click **Publish**.

---

## ⚖️ Regulatory & Educational Disclaimer

> SGX Edu-Trader is a paper trading simulation for educational purposes only. No real securities transactions are conducted and no real money is involved. Not licensed by the Monetary Authority of Singapore (MAS). Not financial advice under the Financial Advisers Act (Cap. 110) or Securities and Futures Act (Cap. 289) of Singapore. Not affiliated with Singapore Exchange Limited (SGX Group).
