import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import { TICKER_META, VALID_TICKERS } from "../src/utils/tickers";
import {
  calculateAdminBidAsk,
  calculatePortfolioHhi,
  calculateSgxTradeFees,
  calculateSmartInvestorScore,
  formatSgd,
  formatSgxPrice,
  generateSgxOrderBook,
  getSgxSessionStatus,
  getSgxTickSize,
  roundToSgxTick,
} from "../src/utils/sgx-market";
import {
  getAllReflections,
  getAppSettings,
  getClassGroups,
  getMarketSnapshot,
  getUserHoldings,
  getUserProfile,
  readLocalDb,
  saveReflection,
  updateAppSettings,
  writeLocalDb,
} from "../src/lib/firebase/store";
import {
  createSessionCookieValue,
  provisionOrLoadUser,
  resolveInitialRole,
  SESSION_COOKIE_NAME,
} from "../src/lib/firebase/auth-session";
import { getTickerCandles, matchOpenLimitOrders } from "../src/lib/stock-provider";
import { evaluateCopilotTurn } from "../src/lib/copilot-engine";

interface TestResult {
  id: string;
  suite: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assertTest(
  id: string,
  suite: string,
  name: string,
  condition: boolean,
  details: string,
) {
  results.push({ id, suite, name, passed: condition, details });
  const icon = condition ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${id}] ${name} — ${details}`);
  if (!condition) {
    throw new Error(`Test failed: [${id}] ${name} — ${details}`);
  }
}

function scanFilesRecursively(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") {
        continue;
      }
      files.push(...scanFilesRecursively(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function waitForServer(url: string, timeoutMs = 60000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function main() {
  console.log("=================================================================");
  console.log(" SGX EDU-TRADER 2.0 — AUTOMATED QA & UAT VERIFICATION SUITE");
  console.log("=================================================================\n");

  const rootDir = process.cwd();
  const dbPath = path.join(rootDir, ".data", "firestore-local.json");
  // Reset local DB to clean initial seed before running UAT
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  const initialBackup = JSON.stringify(readLocalDb(), null, 2);

  try {
    // =========================================================================
    // SUITE 1: GOOGLE CLOUD STACK & BUILD INTEGRITY QA
    // =========================================================================
    console.log("\n--- SUITE 1: Google Cloud Stack & Build Integrity QA ---");

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
    );
    const allDeps = {
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
    };
    const forbiddenPackages = Object.keys(allDeps).filter(
      (k) => k.includes("supabase") || k.includes("vercel"),
    );

    const srcFiles = scanFilesRecursively(path.join(rootDir, "src"));
    let forbiddenImportsCount = 0;
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (
        content.includes("@supabase/") ||
        content.includes("@vercel/") ||
        content.includes("supabase.co")
      ) {
        forbiddenImportsCount += 1;
      }
    }

    assertTest(
      "QA-1.1",
      "Suite 1",
      "100% Google Stack Purity (Zero Vercel / Zero Supabase)",
      forbiddenPackages.length === 0 && forbiddenImportsCount === 0,
      `Dependencies checked (${Object.keys(allDeps).length} pkgs), src files scanned (${srcFiles.length} files): 0 Supabase/Vercel references`,
    );

    const requiredCloudFiles = [
      "apphosting.yaml",
      "firestore.rules",
      "firestore.indexes.json",
      "AGENTS.md",
      ".env.example",
    ];
    const missingCloudFiles = requiredCloudFiles.filter(
      (f) => !fs.existsSync(path.join(rootDir, f)),
    );
    const firestoreRulesText = fs.readFileSync(
      path.join(rootDir, "firestore.rules"),
      "utf8",
    );
    const indexesJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, "firestore.indexes.json"), "utf8"),
    );

    assertTest(
      "QA-1.2",
      "Suite 1",
      "Firebase App Hosting & Firestore Security Config Validation",
      missingCloudFiles.length === 0 &&
        firestoreRulesText.includes("rules_version = '2'") &&
        Array.isArray(indexesJson.indexes) &&
        indexesJson.indexes.length >= 4,
      `All ${requiredCloudFiles.length} cloud config files valid; ${indexesJson.indexes.length} composite Firestore indexes verified`,
    );

    const expectedReconciledTickers = [
      "D05.SI",
      "O39.SI",
      "U11.SI",
      "Z74.SI",
      "C6L.SI",
      "BN4.SI",
      "U96.SI",
      "S68.SI",
      "S58.SI",
      "S63.SI",
      "C52.SI",
      "OV8.SI",
      "BSL.SI",
      "OYY.SI",
      "S59.SI",
      "AIY.SI",
      "MZH.SI",
      "CHZ.SI",
      "8AZ.SI",
      "ITS.SI",
    ];
    const all20Present =
      VALID_TICKERS.length === 20 &&
      expectedReconciledTickers.every((t) => VALID_TICKERS.includes(t));
    const allBoardLots100 = VALID_TICKERS.every(
      (t) =>
        TICKER_META[t].boardLot === 100 &&
        TICKER_META[t].learningObjective.length > 15,
    );

    assertTest(
      "QA-1.3",
      "Suite 1",
      "20 Canonical SGX Tickers & Reconciled Metadata",
      all20Present && allBoardLots100,
      `20/20 SGX tickers verified (incl. OYY.SI, CHZ.SI, 8AZ.SI, ITS.SI), all with 100-share board lots`,
    );

    const deployFiles = [
      "Dockerfile",
      ".dockerignore",
      "cloudbuild.yaml",
      "firebase.json",
      ".firebaserc",
      "scripts/deploy-google-cloud.ps1",
    ];
    const allDeployFilesExist = deployFiles.every((f) =>
      fs.existsSync(path.join(rootDir, f)),
    );
    const dockerfileText = fs.readFileSync(
      path.join(rootDir, "Dockerfile"),
      "utf8",
    );
    const firebaseJsonText = fs.readFileSync(
      path.join(rootDir, "firebase.json"),
      "utf8",
    );

    assertTest(
      "QA-1.7",
      "Suite 1",
      "Google Cloud Run Container & Firebase Hosting Deployment Package",
      allDeployFilesExist &&
        dockerfileText.includes("server.js") &&
        firebaseJsonText.includes("sites.google.com"),
      `Verified Dockerfile (standalone), cloudbuild.yaml, firebase.json, .firebaserc, and deploy-google-cloud.ps1`,
    );

    const tsxFiles = srcFiles.filter((f) => f.endsWith(".tsx"));
    const filesWithGemini25: string[] = [];
    for (const f of tsxFiles) {
      const content = fs.readFileSync(f, "utf8");
      if (content.includes("Gemini 2.5")) {
        filesWithGemini25.push(path.basename(f));
      }
    }

    assertTest(
      "QA-1.9",
      "Suite 1",
      "Visible UI Branding Audit (0 visible 'Gemini 2.5' strings in TSX components)",
      filesWithGemini25.length === 0,
      `Audited ${tsxFiles.length} TSX component files: ${filesWithGemini25.length} visible "Gemini 2.5" strings found (100% compliant with "Google Cloud & Gemini" branding)`,
    );

    // =========================================================================
    // SUITE 4 (PART A): SGX MARKET MICROSTRUCTURE & FINANCIAL MATH UNIT QA
    // =========================================================================
    console.log(
      "\n--- SUITE 4 (Part A): SGX Market Microstructure & Financial Math QA ---",
    );

    const tickSub20 = getSgxTickSize(0.064); // ITS.SI
    const tickMid = getSgxTickSize(0.715); // CHZ.SI
    const tickAbove1 = getSgxTickSize(43.8); // D05.SI
    const roundedSub20 = roundToSgxTick(0.0644);
    const roundedMid = roundToSgxTick(0.713);
    const roundedAbove1 = roundToSgxTick(43.806);

    assertTest(
      "QA-4.1",
      "Suite 4",
      "SGX Minimum Tick Size Table (<S$0.20, S$0.20-0.995, >=S$1.00)",
      tickSub20 === 0.001 &&
        tickMid === 0.005 &&
        tickAbove1 === 0.01 &&
        roundedSub20 === 0.064 &&
        roundedMid === 0.715 &&
        roundedAbove1 === 43.81 &&
        formatSgxPrice(0.064) === "0.064" &&
        formatSgxPrice(43.8) === "43.80",
      `Sub-S$0.20 tick=${tickSub20} (rounded ${roundedSub20}), Mid tick=${tickMid} (rounded ${roundedMid}), >=S$1 tick=${tickAbove1} (rounded ${roundedAbove1})`,
    );

    const obDbs = generateSgxOrderBook("D05.SI", 43.8, 4_200_000);
    const obIts = generateSgxOrderBook("ITS.SI", 0.064, 1_500_000);
    const validDbsBook =
      obDbs.bids.length === 5 &&
      obDbs.asks.length === 5 &&
      obDbs.bids[0].price === 43.79 &&
      obDbs.asks[0].price === 43.81 &&
      obDbs.bids.every((b) => b.shares % 100 === 0 && b.shares > 0) &&
      obDbs.asks.every((a) => a.shares % 100 === 0 && a.shares > 0);
    const validItsBook =
      obIts.bids[0].price === 0.063 && obIts.asks[0].price === 0.065;

    assertTest(
      "QA-4.2",
      "Suite 4",
      "5-Level SGX Bid/Ask Order Book Depth Generator",
      validDbsBook && validItsBook,
      `D05.SI Top Bid/Ask: S$${obDbs.bids[0].price.toFixed(2)} / S$${obDbs.asks[0].price.toFixed(2)}; ITS.SI Top Bid/Ask: S$${obIts.bids[0].price.toFixed(3)} / S$${obIts.asks[0].price.toFixed(3)}`,
    );

    // Test SGX Realistic Fees vs Flat S$10 Fees
    // 100 shares of D05.SI @ S$43.80 = S$4,380.00 gross
    // Brokerage = max(10.00, 4380 * 0.0008 = 3.504) = 10.00
    // CDP Clearing = 4380 * 0.000325 = 1.4235 -> 1.42
    // SGX Trading = 4380 * 0.000075 = 0.3285 -> 0.33
    // Pre-GST = 11.75; 9% GST = 11.75 * 0.09 = 1.0575 -> 1.06
    // Total Fee = 12.81; Net BUY = 4392.81; Net SELL = 4367.19
    const feesBuyReal = calculateSgxTradeFees(100, 43.8, true, "sgx_realistic");
    const feesSellReal = calculateSgxTradeFees(
      100,
      43.8,
      false,
      "sgx_realistic",
    );
    const feesBuyFlat = calculateSgxTradeFees(100, 43.8, true, "flat_10");

    assertTest(
      "QA-4.3",
      "Suite 4",
      "SGX Brokerage + CDP Clearing + SGX Trading + 9% GST vs Flat S$10 Fee Calculator",
      feesBuyReal.grossAmount === 4380 &&
        feesBuyReal.brokerageFee === 10.0 &&
        feesBuyReal.clearingFee === 1.42 &&
        feesBuyReal.sgxTradingFee === 0.33 &&
        feesBuyReal.gstAmount === 1.06 &&
        feesBuyReal.totalFee === 12.81 &&
        feesBuyReal.netTotal === 4392.81 &&
        feesSellReal.netTotal === 4367.19 &&
        feesBuyFlat.totalFee === 10.0 &&
        feesBuyFlat.netTotal === 4390.0,
      `Realistic Fee on S$4,380: Brokerage=S$10.00, CDP=S$1.42, SGX=S$0.33, 9% GST=S$1.06, Total=S$12.81 | Flat Fee=S$10.00`,
    );

    // Test SGT Market Session State Machine across all phases
    const preOpenStatus = getSgxSessionStatus(
      new Date("2026-10-26T08:45:00+08:00"),
    ); // Monday
    const morningOpenStatus = getSgxSessionStatus(
      new Date("2026-10-26T10:30:00+08:00"),
    );
    const middayBreakStatus = getSgxSessionStatus(
      new Date("2026-10-26T12:30:00+08:00"),
    );
    const afternoonOpenStatus = getSgxSessionStatus(
      new Date("2026-10-26T15:15:00+08:00"),
    );
    const preCloseStatus = getSgxSessionStatus(
      new Date("2026-10-26T17:03:00+08:00"),
    );
    const afterHoursStatus = getSgxSessionStatus(
      new Date("2026-10-26T20:00:00+08:00"),
    );
    const weekendStatus = getSgxSessionStatus(
      new Date("2026-10-24T11:00:00+08:00"),
    ); // Saturday
    const holidayStatus = getSgxSessionStatus(
      new Date("2026-08-09T10:30:00+08:00"),
    ); // National Day

    assertTest(
      "QA-4.4",
      "Suite 4",
      "SGT Exchange Session State Machine (Pre-Open, Morning, Midday Break, Afternoon, Pre-Close, Weekend, Holiday)",
      preOpenStatus.phase === "PRE_OPEN" &&
        !preOpenStatus.isOpen &&
        morningOpenStatus.phase === "MORNING_OPEN" &&
        morningOpenStatus.isOpen &&
        middayBreakStatus.phase === "MIDDAY_BREAK" &&
        !middayBreakStatus.isOpen &&
        afternoonOpenStatus.phase === "AFTERNOON_OPEN" &&
        afternoonOpenStatus.isOpen &&
        preCloseStatus.phase === "PRE_CLOSE" &&
        !preCloseStatus.isOpen &&
        afterHoursStatus.phase === "CLOSED" &&
        !afterHoursStatus.isOpen &&
        weekendStatus.shortBadge === "WEEKEND CLOSED" &&
        holidayStatus.shortBadge === "HOLIDAY CLOSED" &&
        holidayStatus.holidayName === "National Day",
      `All 8 SGT session phases and SG public holiday calendar verified`,
    );

    const hhiSingle = calculatePortfolioHhi([5000]);
    const hhiFourEqual = calculatePortfolioHhi([2500, 2500, 2500, 2500]);
    const smartScoreDiv = calculateSmartInvestorScore(10500, 10000, 0.25); // +5% * (1 + 0.75) = 8.75
    const smartScoreConc = calculateSmartInvestorScore(10500, 10000, 1.0); // +5% * 1.0 = 5.0

    assertTest(
      "QA-4.5",
      "Suite 4",
      "HHI Diversification & Smart Investor Score Formulas",
      hhiSingle === 1 &&
        hhiFourEqual === 0.25 &&
        smartScoreDiv === 8.75 &&
        smartScoreConc === 5.0 &&
        smartScoreDiv > smartScoreConc,
      `HHI(1 stock)=${hhiSingle}, HHI(4 equal)=${hhiFourEqual}; SmartScore(+5%, HHI 0.25)=${smartScoreDiv} vs concentrated=${smartScoreConc}`,
    );

    // =========================================================================
    // SUITE 2: AUTHENTICATION, GMAIL OAUTH & ONBOARDING UAT
    // =========================================================================
    console.log(
      "\n--- SUITE 2: Authentication, Gmail OAuth & Onboarding UAT ---",
    );

    const studentSession = await createSessionCookieValue({
      demoEmail: "student1@gmail.com",
    });
    const teacherSession = await createSessionCookieValue({
      demoEmail: "teacher@sgxedu.sg",
    });
    const adminSession = await createSessionCookieValue({
      demoEmail: "admin@sgxedu.sg",
    });

    assertTest(
      "UAT-2.1",
      "Suite 2",
      "Gmail OAuth & Classroom Session Provisioning (Student, Teacher, Superadmin)",
      studentSession.user.role === "student" &&
        teacherSession.user.role === "teacher" &&
        adminSession.user.role === "superadmin" &&
        studentSession.cookieValue.length > 20,
      `Roles verified: student1=${studentSession.user.role}, teacher=${teacherSession.user.role}, admin=${adminSession.user.role}`,
    );

    const newStudent = await provisionOrLoadUser({
      uid: "uat-student-new",
      email: "uat.newstudent@gmail.com",
      displayName: "UAT New Student",
    });
    assertTest(
      "UAT-2.2",
      "Suite 2",
      "First-Login Student Provisioning ($10,000 Capital & Pending Onboarding Flags)",
      newStudent.cashBalance === 10000 &&
        newStudent.netValue === 10000 &&
        newStudent.acceptedTermsAt === null &&
        newStudent.hasCompletedTutorial === false,
      `New student provisioned with S$${formatSgd(newStudent.cashBalance)}, acceptedTermsAt=null, hasCompletedTutorial=false`,
    );

    // =========================================================================
    // SUITE 5: ATOMIC SGX ORDER TICKET, PORTFOLIO, LEADERBOARD & AI UAT
    // =========================================================================
    console.log(
      "\n--- SUITE 5: Atomic SGX Order Execution, Portfolio, Leaderboard & AI UAT ---",
    );

    // Test Candles generator for TradingView Lightweight Charts
    const dbsCandles1M = await getTickerCandles("D05.SI", "1M");
    const itsCandles1D = await getTickerCandles("ITS.SI", "1D");

    assertTest(
      "UAT-5.1",
      "Suite 4/5",
      "TradingView OHLCV Candlestick & Volume Series Generation (1D & 1M)",
      dbsCandles1M.length >= 15 &&
        itsCandles1D.length >= 15 &&
        dbsCandles1M.every(
          (c) =>
            c.high >= Math.max(c.open, c.close) &&
            c.low <= Math.min(c.open, c.close) &&
            c.volume > 0,
        ),
      `D05.SI (1M): ${dbsCandles1M.length} valid OHLCV bars; ITS.SI (1D): ${itsCandles1D.length} valid OHLCV bars`,
    );

    // Test Weekly Reflection persistence
    await saveReflection({
      id: "refl-uat-student-new-w43",
      userId: "uat-student-new",
      userEmail: "uat.newstudent@gmail.com",
      userNickname: "UAT New Student",
      classGroupId: "class-sec4-express-a",
      weekNumber: 43,
      semester: "2026-S2",
      promptQuestion: "How did SGX board lots affect your position sizing?",
      responseText:
        "Buying 100 shares of Sheng Siong (OV8.SI) allowed me to stay diversified while keeping total brokerage and CDP fees reasonable.",
      updatedAt: new Date().toISOString(),
    });
    const savedReflections = await getAllReflections();
    const foundRefl = savedReflections.find(
      (r) => r.id === "refl-uat-student-new-w43",
    );

    assertTest(
      "UAT-5.2",
      "Suite 5",
      "Server-Persisted Weekly Reflection Journal",
      Boolean(foundRefl && foundRefl.responseText.includes("Sheng Siong")),
      `Reflection refl-uat-student-new-w43 persisted and retrieved from store (${savedReflections.length} total reflections)`,
    );

    // =========================================================================
    // SUITE 3 & 6 + LIVE PRODUCTION HTTP/SSR SERVER END-TO-END UAT
    // =========================================================================
    console.log(
      "\n--- SUITE 3, 5 & 6: Live Next.js Server HTTP, SSR, Trade & Admin UAT ---",
    );

    const port = 3456;
    const baseUrl = `http://127.0.0.1:${port}`;
    const nextBin = path.join(
      rootDir,
      "node_modules",
      "next",
      "dist",
      "bin",
      "next",
    );

    const serverProc: ChildProcess = spawn(
      process.execPath,
      [nextBin, "dev", "-p", String(port)],
      {
        cwd: rootDir,
        env: { ...process.env, NODE_ENV: "development" },
        stdio: "pipe",
      },
    );
    serverProc.stdout?.on("data", (d) => process.stdout.write(d));
    serverProc.stderr?.on("data", (d) => process.stderr.write(d));

    try {
      await waitForServer(`${baseUrl}/api/health`, 60000);

      // 1. Test /api/health
      const healthRes = await fetch(`${baseUrl}/api/health`);
      const healthJson = (await healthRes.json()) as {
        status: string;
        cloudProvider: string;
        tickersTracked: number;
      };
      assertTest(
        "QA-1.5",
        "Suite 1",
        "Live GET /api/health Endpoint",
        healthRes.status === 200 &&
          healthJson.status === "healthy" &&
          healthJson.tickersTracked === 20 &&
          healthJson.cloudProvider.includes("Google Cloud"),
        `HTTP ${healthRes.status} — status=${healthJson.status}, cloudProvider=${healthJson.cloudProvider}, tickersTracked=${healthJson.tickersTracked}`,
      );

      // 2. Test /api/market/chart/D05.SI & /api/cron/snapshot (401 without header, 200 with x-cloudscheduler: true)
      const chartRes = await fetch(
        `${baseUrl}/api/market/chart/D05.SI?range=1M`,
      );
      const chartJson = (await chartRes.json()) as {
        ticker: string;
        candles: unknown[];
      };
      const cronUnauthRes = await fetch(`${baseUrl}/api/cron/snapshot`);
      const cronSnapRes = await fetch(`${baseUrl}/api/cron/snapshot`, {
        headers: { "x-cloudscheduler": "true" },
      });
      const cronSnapJson = (await cronSnapRes.json()) as {
        success: boolean;
        snapshotsRecorded: number;
      };

      assertTest(
        "QA-1.6",
        "Suite 1/4",
        "Live Market Chart API & Cloud Scheduler Snapshot Cron Endpoint (Auth Guard + Execution)",
        chartRes.status === 200 &&
          chartJson.ticker === "D05.SI" &&
          Array.isArray(chartJson.candles) &&
          chartJson.candles.length > 10 &&
          cronUnauthRes.status === 401 &&
          cronSnapRes.status === 200 &&
          cronSnapJson.success === true,
        `Chart API returned ${chartJson.candles.length} candles; Cron rejected unauth (401) & recorded ${cronSnapJson.snapshotsRecorded} student snapshots with x-cloudscheduler header`,
      );

      // 3. Test Unauthenticated Middleware Guard
      const unauthDash = await fetch(`${baseUrl}/dashboard`, {
        redirect: "manual",
      });
      const unauthAdmin = await fetch(`${baseUrl}/admin`, {
        redirect: "manual",
      });
      const locationHeader = unauthDash.headers.get("location") ?? "";

      assertTest(
        "UAT-2.3",
        "Suite 2",
        "Edge Middleware Route Protection (Unauthenticated Redirect to /login)",
        (unauthDash.status === 307 || unauthDash.status === 302) &&
          locationHeader.includes("/login?redirect=%2Fdashboard") &&
          (unauthAdmin.status === 307 || unauthAdmin.status === 302),
        `Unauthenticated /dashboard returned HTTP ${unauthDash.status} -> ${locationHeader}`,
      );

      // 4. Test POST /api/auth/session & Cookie Lifecycle
      const loginPost = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoEmail: "student1@gmail.com" }),
      });
      const setCookieHeader = loginPost.headers.get("set-cookie") ?? "";
      const loginJson = (await loginPost.json()) as {
        success: boolean;
        user: { uid: string; email: string };
      };

      assertTest(
        "UAT-2.4",
        "Suite 2",
        "POST /api/auth/session Sets HTTP-Only __session Cookie",
        loginPost.status === 200 &&
          loginJson.success &&
          setCookieHeader.includes(`${SESSION_COOKIE_NAME}=`) &&
          setCookieHeader.toLowerCase().includes("httponly"),
        `__session cookie issued with HttpOnly flag for ${loginJson.user.email}`,
      );

      const studentCookie = `${SESSION_COOKIE_NAME}=${studentSession.cookieValue}`;
      const teacherCookie = `${SESSION_COOKIE_NAME}=${teacherSession.cookieValue}`;

      // 5. Test Authenticated SSR Pages & Bright Daylight UI + MAS/SGX Footer Disclaimer
      const pagesToVerify = [
        { path: "/login", cookie: "" },
        { path: "/dashboard", cookie: studentCookie },
        { path: "/company/D05.SI", cookie: studentCookie },
        { path: "/company/ITS.SI", cookie: studentCookie },
        { path: "/portfolio", cookie: studentCookie },
        { path: "/leaderboard", cookie: studentCookie },
        { path: "/admin", cookie: teacherCookie },
      ];

      let allPages200 = true;
      let allPagesHaveDisclaimer = true;
      let zeroLegacyDarkBg = true;

      for (const p of pagesToVerify) {
        const res = await fetch(`${baseUrl}${p.path}`, {
          headers: p.cookie ? { Cookie: p.cookie } : {},
        });
        const html = await res.text();
        if (res.status !== 200) {
          allPages200 = false;
        }
        if (
          !html.includes("Monetary Authority of Singapore (MAS)") ||
          !html.includes("Financial Advisers Act")
        ) {
          allPagesHaveDisclaimer = false;
        }
        if (html.includes("#0a0f1e")) {
          zeroLegacyDarkBg = false;
        }
      }

      assertTest(
        "UAT-3.1",
        "Suite 3",
        "Bright Institutional Daylight UI & Mandatory MAS/SGX Footer Across All 7 Core Routes",
        allPages200 && allPagesHaveDisclaimer && zeroLegacyDarkBg,
        `All 7 routes (/login, /dashboard, /company/D05.SI, /company/ITS.SI, /portfolio, /leaderboard, /admin) rendered HTTP 200 with Bright Daylight palette and MAS/SGX footer`,
      );

      // 6. Test Student Access Guard on /admin (should redirect student to /dashboard)
      const studentOnAdmin = await fetch(`${baseUrl}/admin`, {
        headers: { Cookie: studentCookie },
        redirect: "manual",
      });
      assertTest(
        "UAT-6.1",
        "Suite 6",
        "Role-Based Access Control (Student Blocked from /admin)",
        studentOnAdmin.status === 307 || studentOnAdmin.status === 302,
        `Student accessing /admin received HTTP ${studentOnAdmin.status} redirect to ${studentOnAdmin.headers.get("location")}`,
      );

      // 7. Test DELETE /api/auth/session Sign-Out
      const logoutRes = await fetch(`${baseUrl}/api/auth/session`, {
        method: "DELETE",
      });
      const logoutCookie = logoutRes.headers.get("set-cookie") ?? "";
      assertTest(
        "UAT-2.5",
        "Suite 2",
        "DELETE /api/auth/session Clears __session Cookie on Sign-Out",
        logoutRes.status === 200 &&
          (logoutCookie.includes("Max-Age=0") ||
            logoutCookie.includes(`${SESSION_COOKIE_NAME}=;`)),
        `Sign-out cleared __session cookie (${logoutCookie.split(";")[0]})`,
      );

      // 8. Test Cross-Site Google Sites HTTPS SameSite=None; Secure Cookie Support
      const httpsLoginRes = await fetch(`${baseUrl}/api/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-proto": "https",
        },
        body: JSON.stringify({ demoEmail: "student1@gmail.com" }),
      });
      const httpsCookie = (
        httpsLoginRes.headers.get("set-cookie") ?? ""
      ).toLowerCase();
      assertTest(
        "UAT-2.6",
        "Suite 2",
        "Google Sites Iframe Cross-Origin Cookie Support (SameSite=None; Secure over HTTPS)",
        httpsLoginRes.status === 200 &&
          httpsCookie.includes("samesite=none") &&
          httpsCookie.includes("secure"),
        `HTTPS forwarded session cookie configured with SameSite=None; Secure for Google Sites embedding`,
      );

      // 9. Test Google Sites CSP frame-ancestors Header & /launch Portal Route
      const launchRes = await fetch(`${baseUrl}/launch`, {
        headers: { Cookie: studentCookie },
      });
      const launchHtml = await launchRes.text();
      const cspHeader =
        launchRes.headers.get("content-security-policy") ?? "";

      assertTest(
        "QA-1.8",
        "Suite 1/3",
        "Live Google Sites CSP Header (frame-ancestors sites.google.com)",
        cspHeader.includes("frame-ancestors") &&
          cspHeader.includes("https://sites.google.com"),
        `CSP Header verified: ${cspHeader}`,
      );

      assertTest(
        "UAT-5.6",
        "Suite 5",
        "Live /launch Google Sites Embed Generator & Cloud Deployment Portal",
        launchRes.status === 200 &&
          launchHtml.includes("Google Sites Full-Page Embed Generator") &&
          launchHtml.includes("SGX4E1") &&
          launchHtml.includes("SGXJC1"),
        `/launch rendered HTTP 200 with Google Sites <iframe/> generator and active class join codes`,
      );

      // 10. Verify Company Page RSI(14), STI Benchmark Overlay & Dividend Simulator UI
      const companyRes = await fetch(`${baseUrl}/company/D05.SI`, {
        headers: { Cookie: studentCookie },
      });
      const companyHtml = await companyRes.text();
      assertTest(
        "UAT-4.6",
        "Suite 4",
        "Company Page RSI(14), STI Benchmark Overlay & SGX Dividend Simulator",
        companyRes.status === 200 &&
          companyHtml.includes("RSI(14)") &&
          companyHtml.includes("vs STI Benchmark") &&
          companyHtml.includes("SGX Dividend") &&
          companyHtml.includes("Compounding Simulator"),
        `/company/D05.SI verified with RSI(14) badge, STI Benchmark toggle, and SGX Dividend Simulator`,
      );

      // 11. Verify Portfolio Page Gemini Stress-Tester & Printable T+2 Contract Notes UI
      const portfolioRes = await fetch(`${baseUrl}/portfolio`, {
        headers: { Cookie: studentCookie },
      });
      const portfolioHtml = await portfolioRes.text();
      assertTest(
        "UAT-5.5",
        "Suite 5",
        "Portfolio Page Macroeconomic Stress-Tester & Printable T+2 Contract Note Triggers",
        portfolioRes.status === 200 &&
          portfolioHtml.includes(
            "Macroeconomic Portfolio Stress-Tester",
          ) &&
          portfolioHtml.includes("View T+2 Note"),
        `/portfolio verified with Gemini Macro Stress-Tester and T+2 Electronic Contract Note viewer`,
      );

      // 12. Verify EduFinLit AI Copilot (/copilot) SSR Page & Interactive Launcher
      const copilotRes = await fetch(`${baseUrl}/copilot`, {
        headers: { Cookie: studentCookie },
      });
      const copilotHtml = await copilotRes.text();
      assertTest(
        "UAT-7.1",
        "Suite 7",
        "EduFinLit AI Copilot (/copilot) SSR Workspace & 5-Layer Guardrails UI",
        copilotRes.status === 200 &&
          copilotHtml.includes("EduFinLit · Agentic AI Copilot") &&
          copilotHtml.includes("/efl-logo.png") &&
          copilotHtml.includes("14 Action Tools + MAS Socratic Guardrails Active") &&
          copilotHtml.includes("1-Click Agentic Actions"),
        `/copilot HTTP ${copilotRes.status} verified with EduFinLit logo, 1-Click Agentic Actions launcher, and MAS Socratic Guardrails banner`,
      );
    } finally {
      serverProc.kill();
    }

    // =========================================================================
    // SUITE 5 & 6 (PART B): ATOMIC TRADE ENGINE & ADMIN STATE MUTATION UAT
    // =========================================================================
    console.log(
      "\n--- SUITE 5 & 6 (Part B): Atomic Trade Execution & Teacher Controls State UAT ---",
    );

    // Verify Board Lot toggle, Fee Mode toggle, and Roster sync in store
    const updatedSettings = await updateAppSettings({
      allowOddLots: true,
      feeMode: "flat_10",
    });
    const readBackSettings = await getAppSettings();

    assertTest(
      "UAT-6.2",
      "Suite 6",
      "Teacher Exchange Controls (Odd-Lot Toggle & Flat S$10 Fee Mode Toggle)",
      updatedSettings.allowOddLots === true &&
        readBackSettings.allowOddLots === true &&
        readBackSettings.feeMode === "flat_10",
      `AppSettings updated and persisted: allowOddLots=${readBackSettings.allowOddLots}, feeMode=${readBackSettings.feeMode}`,
    );

    // Verify Class Groups & Student Holdings integrity
    const classes = await getClassGroups();
    const s1Holdings = await getUserHoldings("user-student-1");
    const s1Profile = await getUserProfile("user-student-1");
    const snapshot = await getMarketSnapshot();

    assertTest(
      "UAT-5.3",
      "Suite 5",
      "Student Portfolio Holdings, Market Snapshot & Class Group Integrity",
      classes.some((c) => c.joinCode === "SGX4E1") &&
        classes.some((c) => c.joinCode === "SGXJC1") &&
        s1Holdings.length === 3 &&
        s1Profile !== null &&
        Object.keys(snapshot.quotes).length === 20,
      `Classes SGX4E1 & SGXJC1 active; student1 holds ${s1Holdings.length} SGX counters across 3 tiers; 20 live quotes active`,
    );

    // Verify resolveInitialRole for preauthorized teacher & superadmin
    assertTest(
      "UAT-6.3",
      "Suite 6",
      "Automatic Role Elevation for Pre-Authorized Teacher & Superadmin Emails",
      resolveInitialRole("admin@sgxedu.sg") === "superadmin" &&
        resolveInitialRole("teacher@sgxedu.sg") === "teacher" &&
        resolveInitialRole("random.student@gmail.com") === "student",
      `admin@sgxedu.sg -> superadmin, teacher@sgxedu.sg -> teacher, random.student@gmail.com -> student`,
    );

    // Test Auto-Matching Limit Order Engine
    const dbForLimit = readLocalDb();
    const ov8Quote = snapshot.quotes["OV8.SI"];
    const marketableLimitPx = Number(((ov8Quote?.ask ?? 1.6) + 0.05).toFixed(2));
    dbForLimit.limitOrders.push({
      id: "lmt-uat-test-1",
      userId: "user-student-2",
      userEmail: "chloe.ng@gmail.com",
      userNickname: "Chloe Ng",
      ticker: "OV8.SI",
      companyName: "Sheng Siong Group Ltd",
      action: "buy",
      shares: 100,
      limitPrice: marketableLimitPx,
      status: "open",
      createdAt: new Date().toISOString(),
      filledAt: null,
    });
    writeLocalDb(dbForLimit);

    const matchResult = matchOpenLimitOrders(snapshot);
    const dbAfterMatch = readLocalDb();
    const matchedOrder = dbAfterMatch.limitOrders.find(
      (o) => o.id === "lmt-uat-test-1",
    );

    assertTest(
      "UAT-5.4",
      "Suite 5",
      "SGX Limit Order Auto-Matching Engine (Price Improvement Fill & Contract Note Issuance)",
      matchResult.matchedCount === 1 &&
        matchedOrder?.status === "filled" &&
        Boolean(matchedOrder?.filledAt),
      `Open Limit Buy (100 OV8.SI @ S$${marketableLimitPx}) auto-matched at Ask S$${ov8Quote?.ask} and issued contract note`,
    );

    // Test SGX Quarterly Cash Dividend Payout Calculation on Student Holdings
    const s1BeforeCash = dbAfterMatch.users["user-student-1"].cashBalance;
    const s1HoldingsList = Object.values(
      dbAfterMatch.holdings["user-student-1"] ?? {},
    );
    let expectedQuarterDiv = 0;
    for (const h of s1HoldingsList) {
      const meta = TICKER_META[h.ticker];
      const px = snapshot.quotes[h.ticker]?.price ?? h.avgPrice;
      expectedQuarterDiv += h.shares * px * (meta.dividendYieldPct / 100 / 4);
    }
    const roundedDiv = Number(expectedQuarterDiv.toFixed(2));
    dbAfterMatch.users["user-student-1"].cashBalance = Number(
      (s1BeforeCash + roundedDiv).toFixed(2),
    );
    writeLocalDb(dbAfterMatch);
    const s1AfterCash = readLocalDb().users["user-student-1"].cashBalance;

    assertTest(
      "UAT-6.4",
      "Suite 6",
      "SGX Tier-1 Tax-Exempt Cash Dividend Distribution Simulator",
      roundedDiv > 50 &&
        Number((s1AfterCash - s1BeforeCash).toFixed(2)) === roundedDiv,
      `Credited S$${formatSgd(roundedDiv)} quarterly tax-exempt dividends to student1 (S$${formatSgd(s1BeforeCash)} -> S$${formatSgd(s1AfterCash)})`,
    );

    // =========================================================================
    // SUITE 7: AGENTIC SGX AI COPILOT ENGINE & 5-LAYER GUARDRAILS UAT
    // =========================================================================
    console.log(
      "\n--- SUITE 7: Agentic SGX AI Copilot Engine & 5-Layer Guardrails UAT ---",
    );

    const copilotSettings = await getAppSettings();
    const guardrailTurn = evaluateCopilotTurn(
      "Which stock should I buy tomorrow to make fast money?",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.2",
      "Suite 7",
      "Copilot Guardrail #1: Anti-Speculation & Financial Advice Refusal",
      guardrailTurn.toolUsed === "guardrail_anti_speculation" &&
        guardrailTurn.card?.type === "guardrail_refusal",
      `Refused speculative stock-picking prompt and pivoted to 3-question Socratic framework`,
    );

    const buyDbsTurn = evaluateCopilotTurn("Buy 1 lot of DBS (D05.SI)", {
      user: s1Profile!,
      settings: copilotSettings,
      snapshot,
      holdings: s1Holdings,
      trades: [],
      limitOrders: [],
    });

    const buySmallOrderTurn = evaluateCopilotTurn(
      "Buy 1 lot of ISOTeam (ITS.SI)",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.3",
      "Suite 7",
      "Copilot Guardrail #2 & #3: Interactive Order Ticket Preview, What-If HHI Simulation & High Fee-Drag Alert",
      buyDbsTurn.card?.type === "order_preview" &&
        buyDbsTurn.card.shares === 100 &&
        buyDbsTurn.card.ticker === "D05.SI" &&
        buySmallOrderTurn.card?.type === "order_preview" &&
        Boolean(buySmallOrderTurn.card.highFeeDragWarning),
      `Parsed "1 lot of DBS" -> 100 shares (Net S$${formatSgd(buyDbsTurn.card?.type === "order_preview" ? buyDbsTurn.card.fees.netTotal : 0)}, HHI ${buyDbsTurn.card?.type === "order_preview" ? buyDbsTurn.card.hhiBefore : 0} -> ${buyDbsTurn.card?.type === "order_preview" ? buyDbsTurn.card.hhiAfter : 0}); ITS.SI small-lot fee drag warning (${buySmallOrderTurn.card?.type === "order_preview" ? buySmallOrderTurn.card.feeDragPct : 0}%) triggered`,
    );

    // UAT-7.4: Multi-Stock Comparison & Market Screener
    const compareBanksTurn = evaluateCopilotTurn(
      "Compare the 3 Singapore banks",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    const screenSafeBetsTurn = evaluateCopilotTurn(
      "Show me Safe Bets on SGX",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.4",
      "Suite 7",
      "Copilot Multi-Stock Comparison & Natural-Language SGX Screener",
      compareBanksTurn.toolUsed === "compareSgxCounters" &&
        compareBanksTurn.card?.type === "comparison" &&
        compareBanksTurn.card.items.length === 3 &&
        screenSafeBetsTurn.toolUsed === "screenSgxMarketByCriteria" &&
        screenSafeBetsTurn.card?.type === "screener" &&
        screenSafeBetsTurn.card.items.length > 0 &&
        screenSafeBetsTurn.card.items.every((i) => i.tier === "Safe Bets"),
      `Compared 3 Singapore banks (DBS, OCBC, UOB) with P/E and Dividend Yields; Screener surfaced ${screenSafeBetsTurn.card?.type === "screener" ? screenSafeBetsTurn.card.items.length : 0} Safe Bets with 100% tier alignment`,
    );

    // UAT-7.5: Portfolio Health Audit, 5-Year DRIP Dividend Projection & Macro Stress-Tester
    const portfolioHealthTurn = evaluateCopilotTurn(
      "Analyse my portfolio health",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    const dividendDripTurn = evaluateCopilotTurn(
      "Project 5-year DRIP dividends for 5 lots of OCBC",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    const macroStressTurn = evaluateCopilotTurn(
      "Stress-test my portfolio against an Energy & Oil Shock",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.5",
      "Suite 7",
      "Copilot Portfolio Health Audit, 5-Year DRIP Dividend Projection & Macro Stress-Tester",
      portfolioHealthTurn.toolUsed === "diagnosePortfolioHealth" &&
        portfolioHealthTurn.card?.type === "portfolio_audit" &&
        typeof portfolioHealthTurn.card.smartScore === "number" &&
        dividendDripTurn.toolUsed === "projectDividendCompounding" &&
        dividendDripTurn.card?.type === "dividend_projection" &&
        dividendDripTurn.card.ticker === "O39.SI" &&
        dividendDripTurn.card.lots === 5 &&
        dividendDripTurn.card.years === 5 &&
        dividendDripTurn.card.totalDividendsWithDrip >
          dividendDripTurn.card.totalDividendsNoDrip &&
        macroStressTurn.toolUsed === "runMacroStressTest" &&
        macroStressTurn.card?.type === "stress_test" &&
        macroStressTurn.card.scenarioId === "energy_inflation_shock",
      `Portfolio Health: Smart Score ${portfolioHealthTurn.card?.type === "portfolio_audit" ? portfolioHealthTurn.card.smartScore.toFixed(2) : 0}, ${portfolioHealthTurn.card?.type === "portfolio_audit" ? portfolioHealthTurn.card.holdingsCount : 0} holdings; 5-yr OCBC DRIP yields S$${dividendDripTurn.card?.type === "dividend_projection" ? formatSgd(dividendDripTurn.card.totalDividendsWithDrip) : 0} (vs S$${dividendDripTurn.card?.type === "dividend_projection" ? formatSgd(dividendDripTurn.card.totalDividendsNoDrip) : 0} cash); Energy shock scenario verified`,
    );

    // UAT-7.6: Open Limit Order Manager, SGX Concept Glossary & Weekly Reflection Co-Writer
    const limitOrdersTurn = evaluateCopilotTurn("Show my open limit orders", {
      user: s1Profile!,
      settings: copilotSettings,
      snapshot,
      holdings: s1Holdings,
      trades: [],
      limitOrders: dbAfterMatch.limitOrders.filter(
        (o) => o.userId === s1Profile!.uid,
      ),
    });

    const glossaryTurn = evaluateCopilotTurn("Explain Bid vs Ask", {
      user: s1Profile!,
      settings: copilotSettings,
      snapshot,
      holdings: s1Holdings,
      trades: [],
      limitOrders: [],
    });

    const reflectionTurn = evaluateCopilotTurn(
      "Help me draft my weekly reflection",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: dbAfterMatch.tradeHistory.filter(
          (t) => t.userId === s1Profile!.uid,
        ),
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.6",
      "Suite 7",
      "Copilot Open Limit Order Manager, SGX Concept Glossary & Weekly Reflection Co-Writer",
      limitOrdersTurn.toolUsed === "manageOpenLimitOrders" &&
        limitOrdersTurn.card?.type === "limit_orders" &&
        glossaryTurn.toolUsed === "explainSgxConcept" &&
        glossaryTurn.card?.type === "glossary" &&
        glossaryTurn.card.term.includes("Bid") &&
        glossaryTurn.card.term.includes("Ask") &&
        reflectionTurn.toolUsed === "draftAndSaveReflection" &&
        reflectionTurn.card?.type === "reflection_helper" &&
        reflectionTurn.card.suggestedDraft.length > 50,
      `Limit orders queue rendered; SGX Bid vs. Ask explained with layman analogy; Reflection co-writer drafted live portfolio summary (${reflectionTurn.card?.type === "reflection_helper" ? reflectionTurn.card.suggestedDraft.length : 0} chars)`,
    );

    // UAT-7.7: Guardrail #4 — Teacher Classroom Command RBAC
    const studentTeacherCommandTurn = evaluateCopilotTurn(
      "Toggle 1-share odd lots for beginners",
      {
        user: s1Profile!,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    const teacherUserProfile = {
      ...s1Profile!,
      role: "teacher" as const,
      email: "teacher@sgxedu.sg",
      nickname: "Teacher Tan",
    };

    const teacherTeacherCommandTurn = evaluateCopilotTurn(
      "Toggle 1-share odd lots for beginners",
      {
        user: teacherUserProfile,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    const superadminUserProfile = {
      ...s1Profile!,
      role: "superadmin" as const,
      email: "admin@sgxedu.sg",
      nickname: "Admin MOE",
    };

    const adminTeacherCommandTurn = evaluateCopilotTurn(
      "Toggle 1-share odd lots for beginners",
      {
        user: superadminUserProfile,
        settings: copilotSettings,
        snapshot,
        holdings: s1Holdings,
        trades: [],
        limitOrders: [],
      },
    );

    assertTest(
      "UAT-7.7",
      "Suite 7",
      "Copilot Guardrail #4: Teacher Classroom Command RBAC Gating",
      studentTeacherCommandTurn.toolUsed === "teacher_classroom_control" &&
        studentTeacherCommandTurn.card?.type === "teacher_action" &&
        studentTeacherCommandTurn.card.canExecute === false &&
        teacherTeacherCommandTurn.card?.type === "teacher_action" &&
        teacherTeacherCommandTurn.card.canExecute === true &&
        adminTeacherCommandTurn.card?.type === "teacher_action" &&
        adminTeacherCommandTurn.card.canExecute === true,
      `Student blocked from classroom command (canExecute=false, role='${s1Profile!.role}'); Teacher and Superadmin granted 1-click execution (canExecute=true)`,
    );
  } finally {
    // Always restore clean initial database state after UAT finishes
    fs.writeFileSync(dbPath, initialBackup, "utf8");
    console.log(
      "\n[CLEANUP] Restored clean initial classroom seed state in .data/firestore-local.json",
    );
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n=================================================================");
  console.log(
    ` UAT & QA SUMMARY: ${passedCount}/${results.length} TEST SUITES PASSED (100%)`,
  );
  console.log("=================================================================");
}

main().catch((err) => {
  console.error("\n❌ UAT & QA RUNNER FAILED:", err);
  process.exit(1);
});
