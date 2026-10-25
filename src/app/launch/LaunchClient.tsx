"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  GraduationCap,
  HelpCircle,
  Layers,
  MessageSquareShare,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";

interface Props {
  schoolName: string;
  semester: string;
  tickersCount: number;
  classCodes: Array<{ name: string; code: string }>;
}

type HandbookRole = "student" | "teacher" | "admin";

interface VideoBeat {
  time: string;
  cue: string;
  callout: string;
  vo: string;
}

interface EpisodeCardData {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  role: HandbookRole;
  targetAudience: string;
  thumbnailDesc: string;
  hook: string;
  challenge: string;
  beats: VideoBeat[];
}

const EPISODES_DATA: EpisodeCardData[] = [
  {
    id: "ep1",
    number: "Episode 01",
    title: "Your First S$10,000 on the SGX Market",
    subtitle: "From First Login to Your First T+2 Contract Note",
    duration: "3:30",
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "Split frame: Glowing S$10,000 virtual balance badge and live DBS candlestick chart with headline: DON'T GAMBLE YOUR S$10K 📉 — MASTER SGX IN 3 MINS",
    hook: "Imagine walking into the Singapore Exchange with S$10,000 in virtual cash to invest in companies you see every day: DBS, Sheng Siong, Singtel, and SIA. No fake tokens—100% authentic SGX market rules.",
    challenge:
      "Sign in to EduFinLit, navigate to /company/OV8.SI, adjust the quantity from 100 to 500 shares, observe how the Fee Drag percentage drops from over 6% to under 1.5%, write a 1-sentence thesis, and execute!",
    beats: [
      {
        time: "0:00 - 0:18",
        cue: "A-Roll Studio Intro (Creator holding Singapore dollar note)",
        callout: "S$10,000 Virtual Capital · 20 SGX Blue Chips · 0% Real Risk",
        vo: "Imagine walking into the Singapore Exchange with ten thousand dollars in your pocket. No fake tokens, no fantasy land—ten thousand real Singapore dollars in virtual cash to invest in companies you see every single day: DBS Bank, Sheng Siong supermarkets, Singtel, and Singapore Airlines.",
      },
      {
        time: "0:18 - 0:38",
        cue: "Screen Recording: /login page",
        callout: "Continue with Google (Gmail) · 1-Click Demo Profiles",
        vo: "Head over to EduFinLit. You can sign in instantly with your Google account, or if your teacher has prepared a computer lab demo, simply click your assigned demo profile with one click. No lengthy registration forms, no passwords to forget.",
      },
      {
        time: "0:38 - 1:02",
        cue: "Screen Recording: First-Login Onboarding Modal",
        callout: "Class Join Code (e.g. SGX4E1) · Auto-Provision S$10k Cash",
        vo: "On your first login, pick a trader handle and enter your teacher's Class Join Code—like SGX4E1 or SGXJC1. The moment you confirm, your account is provisioned with exactly S$10,000.00 in cash, and your portfolio is connected to your school's live class leaderboard.",
      },
      {
        time: "1:02 - 1:35",
        cue: "Screen Recording: /dashboard Market Screener",
        callout: "Live SGT Session Clock · 4 Risk Tiers (Safe Bets, Giants, Everyday, High Risk)",
        vo: "Here is your command center: the SGX Market Screener. Notice the live clock at the top right—it tracks actual Singapore Trading Hours: Pre-Open, Morning Open, Midday Break, and Pre-Close. All 20 companies are grouped into 4 intuitive Risk Tiers.",
      },
      {
        time: "1:35 - 2:10",
        cue: "Screen Recording: /company/OV8.SI Order Ticket",
        callout: "SGX Board Lot = 100 Shares · Sheng Siong @ S$1.58",
        vo: "Let's buy shares of Sheng Siong. On the Singapore Exchange, shares trade in standard bundles called Board Lots of 100 shares. At S$1.58 per share, 100 shares cost S$158.00 gross. But wait! Look closely at the fee breakdown.",
      },
      {
        time: "2:10 - 2:45",
        cue: "Screen Recording: Fee Calculation Breakdown Zoom",
        callout: "S$10.00 Min Brokerage + CDP + SGX + 9% GST = 6.94% Fee Drag!",
        vo: "Singapore brokers charge a minimum brokerage fee, typically S$10.00 plus CDP clearing fees and 9% GST. If you only buy 100 shares of a S$1.50 stock, you're paying nearly S$11 in fees—that's a 7% drag! But if you size to 1,000 shares (S$1,580), that same fee becomes less than 0.8%! That is Competency FL-C2: Fee Drag Awareness.",
      },
      {
        time: "2:45 - 3:10",
        cue: "Screen Recording: Pre-Trade Thesis & Order Execution",
        callout: "Pre-Trade Thesis & Confidence Tagging (FL-C5) · T+2 Contract Note",
        vo: "Before executing, EduFinLit asks you for your Pre-Trade Thesis and a confidence score from 1 to 5. This metacognitive habit stops emotional impulse trading. Hit submit—and boom! Here is your official T+2 Electronic Contract Note with SGX settlement reference and CDP fees.",
      },
      {
        time: "3:10 - 3:30",
        cue: "A-Roll Studio Outro",
        callout: "Episode 1 Complete: Next up Pro Charts & AI Copilot!",
        vo: "You just completed your very first real-world trade. In Episode 2, we will uncover how to use our Socratic AI Copilot, read professional candlestick charts, and turn on the DRIP dividend snowball!",
      },
    ],
  },
  {
    id: "ep2",
    number: "Episode 02",
    title: "Pro Charts, AI Copilot & The DRIP Snowball",
    subtitle: "TradingView Indicators, 5-Level Depth & Natural-Language Staging",
    duration: "4:00",
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "TradingView candlesticks with emerald SMA lines alongside AI chat window staging an order: SMART TRADING VS RANDOM GUESSING 🤖📈",
    hook: "Most beginner apps give you a single squiggly line and leave you guessing. In EduFinLit, you are trading on the exact same institutional charting engine used by top desks on Raffles Place.",
    challenge:
      "Open /copilot, type 'Compare DBS and Singtel dividend yields and stage a 100-share buy for the one with lower P/E', and test how the Socratic Copilot breaks down valuation before staging your order!",
    beats: [
      {
        time: "0:00 - 0:20",
        cue: "A-Roll Studio Intro (Visual comparison of line vs candlestick chart)",
        callout: "Institutional TradingView Engine · Candlesticks vs Simple Lines",
        vo: "Most beginner apps give you a single squiggly line and leave you guessing. In EduFinLit, you are trading on the exact same institutional charting engine used by top desks on Raffles Place: TradingView Lightweight Charts.",
      },
      {
        time: "0:20 - 0:55",
        cue: "Screen Recording: /company/D05.SI Candlestick Chart",
        callout: "SMA 20/50 · VWAP · RSI(14) Overbought (>70) / Oversold (<30)",
        vo: "Each candlestick tells the full story of that trading session: the Open, High, Low, and Close. Turn on the SMA 20 and 50 moving averages to see the institutional trend. Check the RSI(14) indicator at the bottom: if it shoots above 70, the stock might be overheated; below 30, it could be oversold.",
      },
      {
        time: "0:55 - 1:25",
        cue: "Screen Recording: 5-Level Bid/Ask Depth Book",
        callout: "5 Bids vs 5 Asks · Bid/Ask Spread · SGX Minimum Tick Size Bands",
        vo: "Look right below the chart: this is the 5-Level Bid/Ask Depth Book. Stocks don't have one magic price; there is a queue of buyers bidding, and sellers asking. And notice how DBS ticks in 1-cent steps, while stocks under 20 cents, like ISOTeam (ITS.SI), tick in 0.1-cent steps.",
      },
      {
        time: "1:25 - 2:05",
        cue: "Screen Recording: 5-Year DRIP Simulator",
        callout: "Tax-Exempt Dividends · Reinvesting Cash Payouts for Exponential Share Accumulation",
        vo: "Now here is the real secret of Singapore blue chips: Tax-Exempt Dividends. Singapore has no capital gains tax and no dividend tax on SGX-listed shares! On the DBS page, open the 5-Year DRIP Simulator. Watch how reinvesting quarterly dividends automatically compounds your share count.",
      },
      {
        time: "2:05 - 2:50",
        cue: "Screen Recording: /copilot Natural Language Staging",
        callout: "Natural Language Prompting · Staged Order Preview Cards",
        vo: "Now let's visit your personal trading analyst: the Agentic AI Copilot at /copilot. You can talk to it in natural English. Type: 'Stage an order to buy 100 shares of Singtel at market.' It doesn't execute blindly; it stages an interactive Order Preview Card right in the chat!",
      },
      {
        time: "2:50 - 3:30",
        cue: "Screen Recording: Staged Order Inline Adjusters",
        callout: "[-1 Lot] / [+1 Lot] · [Switch to SELL/BUY] · EduFinLit Socratic Learning Guardrails",
        vo: "Inside this staged card, you can adjust quantities with one tap—click +1 Lot or -1 Lot—or switch from BUY to SELL. And if you ask it for reckless stock tips, our EduFinLit Socratic Learning Guardrails intervene to ask Socratic questions about diversification and valuation.",
      },
      {
        time: "3:30 - 4:00",
        cue: "A-Roll Studio Outro",
        callout: "Technical Indicators + Socratic AI Coaching = Institutional Discipline",
        vo: "Combining pro technical indicators with Socratic AI coaching transforms you from a nervous gambler into a thoughtful, institutional-grade investor. Next up in Episode 3: How to beat the class leaderboard using 1 - HHI!",
      },
    ],
  },
  {
    id: "ep3",
    number: "Episode 03",
    title: "How to Beat the Leaderboard Using 1 − HHI",
    subtitle: "The Smart Investor Score & The 5-Pillar Mastery Rubric",
    duration: "3:15",
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "Podium graphic: 4-stock diversified portfolio beating single-stock gambler with headline: HOW 1 FORMULA CRUSHES GAMBLERS ON THE LEADERBOARD 🏆",
    hook: "In almost every beginner trading game, whoever gambles all their money on a single penny stock and gets lucky ends up in first place. In EduFinLit, that strategy will actually cause you to lose.",
    challenge:
      "Open /portfolio, check your current HHI score, then answer 1 Active Retrieval Quiz question to test your fee-drag calculation speed!",
    beats: [
      {
        time: "0:00 - 0:22",
        cue: "A-Roll Studio Intro (Casino roulette crossed out)",
        callout: "Smart Investor Score = Return × (1 + (1 - HHI))",
        vo: "In almost every beginner trading game, whoever gambles all their money on a single penny stock and gets lucky ends up in first place. That teaches terrible real-world habits. In EduFinLit, our Smart Investor Score rewards true portfolio management.",
      },
      {
        time: "0:22 - 1:05",
        cue: "Screen Recording: /leaderboard Calculations",
        callout: "Gambler (1 Stock, HHI 1.0) = 5.0 pts vs Diversified (4 Stocks, HHI 0.25) = 8.75 pts",
        vo: "Look at the leaderboard. Rankings are determined by your Smart Investor Score: portfolio return multiplied by 1 plus your diversification index, or 1 minus HHI. If you spread across 4 balanced companies, your HHI drops to 0.25, giving you a massive 1.75x multiplier that crushes single-stock gamblers!",
      },
      {
        time: "1:05 - 1:50",
        cue: "Screen Recording: /portfolio Cognitive Learning Passport",
        callout: "5-Pillar Rubric: FL-C1 to FL-C5 · OECD/PISA Competencies",
        vo: "Now open your Student Cognitive Learning Passport on /portfolio. EduFinLit tracks your growth across 5 foundational competencies: Order Discipline, Fee Drag Control, Diversification, Valuation & DRIP, and Metacognitive Reflection.",
      },
      {
        time: "1:50 - 2:30",
        cue: "Screen Recording: Worked Examples & Retrieval Quizzes",
        callout: "Sweller's Cognitive Load Theory · Faded Worked Examples & Retrieval Quizzes",
        vo: "Learning science shows that you don't master investing by reading passive textbooks; you learn through worked examples and active retrieval practice. Test your understanding right inside the passport with bite-sized scenario questions.",
      },
      {
        time: "2:30 - 2:55",
        cue: "Screen Recording: Macro Stress-Tester",
        callout: "Macroeconomic Stress-Testing: SGD Tightening, Semiconductor Boom, Tourism Shock",
        vo: "Wondering how your portfolio will handle a sudden global shock? Trigger the Macroeconomic Stress-Tester. Pick a scenario and watch the AI engine recalculate your portfolio's resilience sector by sector.",
      },
      {
        time: "2:55 - 3:15",
        cue: "A-Roll Studio Outro",
        callout: "Submit Weekly Reflection on /portfolio to claim your badge!",
        vo: "Don't forget to submit your weekly reflection before Friday closing. In Episode 4, we switch over to our teachers and show how any educator can launch a class in under 3 minutes with zero finance background!",
      },
    ],
  },
  {
    id: "ep4",
    number: "Episode 04",
    title: "No Finance Degree Needed: Teacher 3-Minute Classroom Launch",
    subtitle: "Class Join Codes, Odd-Lot Mode & Weekly Challenges",
    duration: "3:30",
    role: "teacher",
    targetAudience: "Teachers, HODs & Educators",
    thumbnailDesc:
      "Teacher smiling in front of smart classroom board showing Teacher Console: TEACH FINANCIAL LITERACY LIKE A PRO — 3-MINUTE ZERO-PREP LAUNCH 👩‍🏫✨",
    hook: "If you are a teacher tasked with running a financial literacy module, you might feel anxious about explaining market microstructure. With EduFinLit, you need zero financial background.",
    challenge:
      "In /admin, create a test class named 'Demo Class A', generate a Join Code, and toggle the 1-Share Odd-Lot switch to see how your students' order ticket updates in real time!",
    beats: [
      {
        time: "0:00 - 0:25",
        cue: "A-Roll Studio Intro (Classroom b-roll)",
        callout: "0 Finance Degree Needed · 100% Automated Calculations · 3-Min Setup",
        vo: "If you are a teacher tasked with running a financial literacy or economics module, you might feel anxious about explaining complex market microstructure or managing student accounts. With EduFinLit, you need zero financial background. The platform automates every calculation.",
      },
      {
        time: "0:25 - 0:55",
        cue: "Screen Recording: /admin Class Groups",
        callout: "Create Class Group · Auto 6-Character Join Code (e.g. SGX4B)",
        vo: "Sign in with your teacher credentials and head to /admin. Click Create Class Group, type your class name—for example, Sec 4 Commercial Studies B—and the system automatically issues a 6-character Class Join Code. Simply write this code on your whiteboard or Google Classroom stream.",
      },
      {
        time: "0:55 - 1:35",
        cue: "Screen Recording: Google Workspace Roster Import",
        callout: "Google Workspace CSV Roster Import · Bulk Provision S$10,000",
        vo: "Want to set up your entire cohort in advance? Use our Google Workspace Roster Sync. Copy the student email column straight from your school spreadsheet or Google Classroom roster, paste it in, and click Import. Every student account is instantly provisioned.",
      },
      {
        time: "1:35 - 2:15",
        cue: "Screen Recording: SGX Market Controls",
        callout: "1-Share Odd-Lot Mode · Realistic Fees vs Flat S$10 · Pause Class Trading",
        vo: "In the SGX Market Controls card: Teaching younger students? Turn ON 1-Share Odd-Lot Mode so students can trade single shares. Teaching upper secondary or JC economics? Turn on Realistic SGX Fees to teach real-world fee drag. And toggle Pause Class Trading to freeze trading during direct instruction!",
      },
      {
        time: "2:15 - 2:50",
        cue: "Screen Recording: Distribute Dividends Button",
        callout: "Distribute Quarterly Tax-Exempt Cash Dividends with 1 Click",
        vo: "Want to demonstrate corporate actions in action? Click Distribute Quarterly Cash Dividends. In one second, the system scans every active holding in your class and credits cash dividends directly to student portfolios.",
      },
      {
        time: "2:50 - 3:15",
        cue: "Screen Recording: Weekly Challenges Tab",
        callout: "Launch Weekly Classroom Challenges: 'Everyday Brands' & 'ESG Infrastructure'",
        vo: "Keep student engagement high every week by launching Weekly Classroom Challenges. Challenges guide students toward structured, intentional research rather than aimless clicking.",
      },
      {
        time: "3:15 - 3:30",
        cue: "A-Roll Studio Outro",
        callout: "3 Minutes, Zero Prep: Your Class is Ready to Trade!",
        vo: "That's it! Three minutes, zero prep, and your class is ready to trade. In Episode 5, we will explore how to assess student learning and export printable report cards with zero manual grading!",
      },
    ],
  },
  {
    id: "ep5",
    number: "Episode 05",
    title: "Grading Financial Literacy & SOLO Taxonomy",
    subtitle: "The 5-Pillar Competency Heatmap, Impact Reports & Google Sheets Export",
    duration: "3:45",
    role: "teacher",
    targetAudience: "Teachers, HODs & School Leadership",
    thumbnailDesc:
      "Competency heatmap matrix with student mastery scores & executive PDF report: GRADING FINANCIAL LITERACY MADE EFFORTLESS 📊🎓",
    hook: "The hardest part of teaching financial literacy has always been assessment. How do you grade a student if the market crashes through no fault of their own? You grade cognitive decision quality.",
    challenge:
      "Open /admin, scroll to the Class Competency Heatmap, click any student name, and copy the auto-generated formative comment directly to your clipboard!",
    beats: [
      {
        time: "0:00 - 0:25",
        cue: "A-Roll Studio Intro (Grading rubrics transformation)",
        callout: "Don't Grade Market Luck ➔ Grade Cognitive Decision Quality",
        vo: "The hardest part of teaching financial literacy has always been assessment. How do you grade a student if the market crashes through no fault of their own? The answer is: you don't grade market luck—you grade cognitive decision quality.",
      },
      {
        time: "0:25 - 1:10",
        cue: "Screen Recording: Class Competency Heatmap",
        callout: "5-Pillar Competency Heatmap: FL-C1 to FL-C5 · Cohort Mastery Analysis",
        vo: "Inside the Teacher Console, open the Class 5-Pillar Competency Heatmap. Every student's activity is automatically evaluated across our 5 competencies. At a single glance, you can identify which students need help with position sizing and which have achieved complete mastery.",
      },
      {
        time: "1:10 - 1:55",
        cue: "Screen Recording: Biggs' SOLO Taxonomy Breakdown",
        callout: "Biggs' SOLO Taxonomy: Pre-structural ➔ Unistructural ➔ Relational ➔ Extended Abstract",
        vo: "EduFinLit anchors this data in Biggs' SOLO Taxonomy. When a student progresses from Unistructural—buying just one stock—to Relational, where they deliberately balance defensive blue chips with growth stocks to minimize HHI, you have concrete proof of higher-order cognitive development.",
      },
      {
        time: "1:55 - 2:40",
        cue: "Screen Recording: Formative Comment Generator",
        callout: "Automated Formative Report Card Comments Generator",
        vo: "Writing formative report card comments used to take hours. EduFinLit generates individualized, standards-aligned formative comments automatically. Each comment identifies the student's strongest competency, current SOLO stage, and next-step learning goal.",
      },
      {
        time: "2:40 - 3:15",
        cue: "Screen Recording: Print School Impact Report (PDF)",
        callout: "Print School Impact Report (PDF) · Board & HOD Ready",
        vo: "Need to report back to your Head of Department, Principal, or school board? Click Print School Impact Report. It produces a polished, executive PDF report summarizing cohort engagement, fee-drag discipline, and competency distribution.",
      },
      {
        time: "3:15 - 3:45",
        cue: "Screen Recording: Google Sheets Gradebook CSV Export",
        callout: "1-Click Export to Google Sheets Gradebook & Rubric CSV",
        vo: "Finally, with 1 click on Export Google Sheets Gradebook, all student data, scores, and comments export directly into a standard CSV file ready to import into your school's LMS or gradebook.",
      },
    ],
  },
  {
    id: "ep6",
    number: "Episode 06",
    title: "1-Click Google Sites Embed & IT Governance",
    subtitle: "Embedding in sites.google.com, Role Management & Cloud Health",
    duration: "3:00",
    role: "admin",
    targetAudience: "School IT Admins, Superadmins & EdTech Leads",
    thumbnailDesc:
      "Google Sites interface embedding EduFinLit with green verified lock icon: 1-CLICK GOOGLE SITES EMBED FOR SCHOOLS 🌐🔒",
    hook: "If you are a school IT administrator or EdTech lead, your top priorities are security, uptime, and ease of deployment. EduFinLit is engineered as a 100% Google Cloud application.",
    challenge:
      "Open /launch, click the 'Copy URL' button under Option A, open a new browser window, and test how smoothly the platform loads with full HTTPS security!",
    beats: [
      {
        time: "0:00 - 0:20",
        cue: "A-Roll Studio Intro (Google Cloud architecture graphic)",
        callout: "100% Google Cloud Native · Firebase Hosting · Zero Server Maintenance",
        vo: "If you are a school IT administrator or EdTech lead, your top priorities are security, uptime, and ease of deployment. EduFinLit is engineered as a 100% Google Cloud application hosted on Firebase Hosting in the asia-southeast1 Singapore region. You do not need to manage any servers.",
      },
      {
        time: "0:20 - 1:00",
        cue: "Screen Recording: /launch Embed Options",
        callout: "Option A: Direct URL Embed · Option B: HTML <iframe> Snippet",
        vo: "Navigate to /launch—our Google Sites & Launch Center. You have two foolproof ways to embed: Option A is as simple as copying your live cloud URL and pasting it into Google Sites under Insert ➔ Embed ➔ By URL. Option B provides a ready-to-use HTML iframe snippet.",
      },
      {
        time: "1:00 - 1:35",
        cue: "Screen Recording: sites.google.com Editor",
        callout: "frame-ancestors sites.google.com CSP Verified · 1-Click Publishing",
        vo: "In your Google Site, simply create a new page named 'SGX Edu-Trader', choose Full page embed, paste your live link, and hit Publish. Because our server headers include frame-ancestors sites.google.com, the simulator loads with zero embedding blocks.",
      },
      {
        time: "1:35 - 2:05",
        cue: "Screen Recording: Chromebook Policy Troubleshooting",
        callout: "SameSite=None; Secure Session Cookies · 1-Click Demo Profiles Fallback",
        vo: "What about school Chromebooks with strict popup restrictions? Our authentication session cookie is configured with SameSite=None; Secure. If strict policies block external popups, students can click 'Open Full-Screen in New Tab' or sign in via 1-Click Demo Profiles with zero popups!",
      },
      {
        time: "2:05 - 2:35",
        cue: "Screen Recording: /admin Superadmin Governance",
        callout: "Role Governance (Student ➔ Teacher ➔ Superadmin) · Semester S$10k Reset",
        vo: "For school IT leads managing user governance: Superadmin accounts can elevate any teacher account with one click. You also have access to the master Contract Note Audit Ledger and the semester-wide Reset All Student Portfolios button.",
      },
      {
        time: "2:35 - 3:00",
        cue: "A-Roll Studio Outro",
        callout: "GET /api/health ➔ 200 OK · 24/7 Cloud Uptime Verified",
        vo: "Check your real-time cloud health at /api/health anytime. With 24/7 uptime, automated backups, and complete Google Workspace integration, EduFinLit is ready for your entire school cohort. Welcome to the future of financial education!",
      },
    ],
  },
];

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

  // Video Walkthrough & Role Handbook State
  const [selectedRole, setSelectedRole] = useState<HandbookRole>("student");
  const [expandedEpisode, setExpandedEpisode] = useState<string | null>("ep1");
  const [copiedHandbook, setCopiedHandbook] = useState(false);

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
  title="${schoolName} — EduFinLit"
  width="100%"
  height="${iframeHeight}px"
  style="border: 1px solid #E2E8F0; border-radius: 16px; background: #F8FAFC;"
  allow="clipboard-write; fullscreen; popups; popups-to-escape-sandbox"
  allowfullscreen
></iframe>`;

  const studentInviteMessage = `Welcome to ${schoolName} — EduFinLit (${semester})!
Start with S$10,000.00 in virtual cash to invest across ${tickersCount} real Singapore Exchange (SGX) companies.

1. Open our live cloud platform: ${cleanBase}
2. Click "Continue with Google (Gmail)" (or pick a 1-Click Demo Student Profile)
3. Enter our Class Join Code: ${selectedJoinCode}`;

  const powerShellDeployCmd = `.\\scripts\\deploy-google-cloud.ps1 -ProjectId "sgx-edu-trader-2-sg" -Region "asia-southeast1"`;

  const gcloudDirectCmd = `gcloud run deploy sgx-edu-trader --source . --region asia-southeast1 --allow-unauthenticated --memory 1Gi && npx firebase-tools deploy --only firestore,hosting`;

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

  const handleCopyRoleHandbook = (role: HandbookRole) => {
    const roleTitles: Record<HandbookRole, string> = {
      student: "EduFinLit Student Field Handbook",
      teacher: "EduFinLit Teacher & HOD Classroom Handbook",
      admin: "EduFinLit Superadmin & School IT Launch Handbook",
    };
    const handbookSnippet = `# ${roleTitles[role]} — Quick Reference Guide
School: ${schoolName} · Semester: ${semester} · Portal: ${cleanBase}

1. S$10,000.00 Starting Virtual Capital across 20 canonical SGX blue chips.
2. Authentic 100-share Board Lot rule and 0.28162% fee breakdown (S$10 minimum brokerage).
3. OECD/PISA and CEE aligned 5-Pillar Financial Literacy Rubric (FL-C1 through FL-C5).
4. Smart Investor Score Formula: Score = Return (%) * (1 + (1 - HHI)).
5. SGT Exchange hours: Pre-Open (08:30), Open (09:00), Midday Break (12:00-13:00), Close (17:00).
6. Google Sites iframe framing authorized via frame-ancestors sites.google.com CSP header.
`;
    copyText("handbook", handbookSnippet);
    setCopiedHandbook(true);
    setTimeout(() => setCopiedHandbook(false), 2400);
  };

  const currentRoleEpisodes = EPISODES_DATA.filter(
    (ep) => ep.role === selectedRole,
  );

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

      {/* ========================================================================= */}
      {/* NEW INTERACTIVE SECTION: Video Walkthroughs & Role Handbooks Studio       */}
      {/* ========================================================================= */}
      <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-white to-slate-50/50 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-100/70 px-3 py-0.5 text-[11px] font-bold text-sgx-blue">
              <PlayCircle className="h-3.5 w-3.5" />
              Creator Video Walkthroughs &amp; Complete Role-Based Handbooks
            </div>
            <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
              🎬 Video Walkthroughs &amp; Role Handbooks (Student · Teacher · Superadmin)
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Step-by-step video scripts, screen-recording storyboards, and
              practical field manuals calibrated for Singapore classrooms. Switch
              roles to view customized walkthroughs and quick-start checklists.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyRoleHandbook(selectedRole)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              {copiedHandbook ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  Copied Handbook!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-sgx-blue" />
                  Copy {selectedRole === "student" ? "Student" : selectedRole === "teacher" ? "Teacher" : "Superadmin"} Handbook
                </>
              )}
            </button>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("student");
              setExpandedEpisode("ep1");
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              selectedRole === "student"
                ? "bg-sgx-blue text-white ring-2 ring-sgx-blue/30"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            👨‍🎓 Student Guide &amp; Videos (Ep 1–3)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("teacher");
              setExpandedEpisode("ep4");
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              selectedRole === "teacher"
                ? "bg-sgx-blue text-white ring-2 ring-sgx-blue/30"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            👩‍🏫 Teacher &amp; HOD Guide (Ep 4–5)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setExpandedEpisode("ep6");
            }}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-xs ${
              selectedRole === "admin"
                ? "bg-sgx-blue text-white ring-2 ring-sgx-blue/30"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            🛡️ Superadmin &amp; IT Guide (Ep 6)
          </button>
        </div>

        {/* Dynamic Role Quick-Start Jump Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sgx-blue shrink-0" />
              <span className="font-bold text-slate-900">
                {selectedRole === "student"
                  ? "Student Core Feature Direct Jumps:"
                  : selectedRole === "teacher"
                  ? "Teacher & HOD Console Direct Jumps:"
                  : "Superadmin IT Direct Jumps:"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedRole === "student" && (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    SGX Screener
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/company/D05.SI"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    DBS Pro Chart
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/copilot"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    AI Copilot
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    Learning Passport
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    Smart Score
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}

              {selectedRole === "teacher" && (
                <>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    Teacher Console (/admin)
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/admin#competency-matrix"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    5-Pillar Heatmap
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    href="/copilot"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    Teacher AI Chat
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}

              {selectedRole === "admin" && (
                <>
                  <a
                    href="/api/health"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    GET /api/health (20 Tickers)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:border-sgx-blue hover:text-sgx-blue"
                  >
                    Role Governance &amp; Audit
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Walkthrough Episode Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-sgx-blue" />
              Creator Video Series: {selectedRole === "student" ? "Episodes 1 to 3" : selectedRole === "teacher" ? "Episodes 4 and 5" : "Episode 6"}
            </h3>
            <span className="text-[11px] text-slate-500">
              Click any episode to expand the full 3-column production script
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentRoleEpisodes.map((ep) => {
              const isExpanded = expandedEpisode === ep.id;
              const isScriptCopied = copiedKey === `script-${ep.id}`;

              return (
                <div
                  key={ep.id}
                  className="rounded-2xl border border-slate-200 bg-white transition shadow-2xs hover:border-blue-300"
                >
                  {/* Episode Card Header */}
                  <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-sgx-blue">
                          {ep.number}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {ep.duration}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {ep.targetAudience}
                        </span>
                      </div>

                      <h4 className="font-display text-base font-extrabold text-slate-900">
                        {ep.title}
                      </h4>
                      <p className="text-xs font-semibold text-sgx-blue">
                        {ep.subtitle}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        &quot;{ep.hook}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const scriptText = ep.beats
                            .map(
                              (b) =>
                                `[${b.time}] ${b.cue}\nCallout: ${b.callout}\nVoiceover: ${b.vo}\n`,
                            )
                            .join("\n");
                          copyText(`script-${ep.id}`, scriptText);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {isScriptCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            Copy Script
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEpisode(isExpanded ? null : ep.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                      >
                        {isExpanded ? (
                          <>
                            Hide Script
                            <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            View Production Script
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail & Micro-Challenge Bar */}
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-slate-600">
                      <strong>Thumbnail Concept:</strong> {ep.thumbnailDesc}
                    </p>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                      ⚡ 60-Second Challenge: {ep.challenge.slice(0, 50)}...
                    </span>
                  </div>

                  {/* Expandable 3-Column Production Script Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-5 space-y-4 bg-white">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>🎬 Full Production Script &amp; Storyboard Beats</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          {ep.beats.length} Scene Blocks
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="p-3 w-1/4">Timestamp &amp; Screen Cue</th>
                              <th className="p-3 w-1/3">On-Screen Kinetic Callout</th>
                              <th className="p-3 w-5/12">Creator Voiceover Script</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {ep.beats.map((b, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                              >
                                <td className="p-3 align-top font-mono text-[11px]">
                                  <span className="font-bold text-sgx-blue block mb-1">
                                    {b.time}
                                  </span>
                                  <span className="text-slate-600 font-sans text-xs">
                                    {b.cue}
                                  </span>
                                </td>
                                <td className="p-3 align-top">
                                  <span className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 font-mono text-[11px] text-blue-900 leading-snug">
                                    {b.callout}
                                  </span>
                                </td>
                                <td className="p-3 align-top text-slate-700 leading-relaxed">
                                  &quot;{b.vo}&quot;
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* "Try This in 60 Seconds" Action Box */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs space-y-1">
                        <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Try This in 60 Seconds Micro-Challenge:
                        </p>
                        <p className="text-emerald-950/90 leading-relaxed">
                          {ep.challenge}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Role Handbook Quick Reference Cards */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-sgx-blue" />
              {selectedRole === "student"
                ? "Student Field Handbook Quick-Reference & Math Cheat-Sheet"
                : selectedRole === "teacher"
                ? "Teacher & HOD Field Handbook Quick-Reference & Assessment Guide"
                : "Superadmin & IT Field Handbook Quick-Reference & Deployment Guide"}
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              EDUFINLIT_HANDBOOK_AND_VIDEO_GUIDE.md
            </span>
          </div>

          {selectedRole === "student" && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  1. SGX Board Lots &amp; Fee-Drag Math
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Standard SGX board lot is <strong>100 shares</strong>. SGX
                  realistic fee structure charges <strong>0.08% Brokerage (S$10 min)</strong> +{" "}
                  <strong>0.0325% CDP Clearing</strong> + <strong>0.0075% SGX Trading</strong> +{" "}
                  <strong>9% GST</strong>. Sizing orders above S$1,500 keeps fee drag &lt; 1.0%!
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  2. Smart Investor Score Formula
                </span>
                <p className="font-mono text-[11px] text-sgx-blue font-bold">
                  Score = Return (%) × (1 + (1 − HHI))
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Where HHI is the sum of squared position weights. A 4-stock
                  balanced portfolio yields HHI = 0.25 (1.75x multiplier),
                  crushing single-stock gamblers on the leaderboard!
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  3. Pre-Trade Metacognition (FL-C5)
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Every trade requires a 1-sentence hypothesis and a 1–5 confidence
                  score. Writing down your reason stops emotional impulse trading
                  and locks in your official T+2 Electronic Contract Note.
                </p>
              </div>
            </div>
          )}

          {selectedRole === "teacher" && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  1. 3-Minute Classroom Onboarding
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Go to <strong>/admin</strong>, click <strong>Create Class Group</strong>,
                  and share the auto-generated 6-character Join Code (e.g. <code>SGX4E1</code>).
                  Or paste your Google Workspace class roster to bulk-provision in seconds.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  2. SGX Market Rule Toggles
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Toggle <strong>1-Share Odd Lots</strong> for younger students,
                  switch between <strong>Realistic Fees</strong> and <strong>Flat S$10</strong>,
                  or click <strong>Pause Trading</strong> to freeze execution during instruction.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  3. SOLO Taxonomy &amp; 1-Click Export
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Assess student decision quality across Biggs&apos; SOLO stages
                  (Pre-structural ➔ Relational). Print the School Impact Report PDF
                  or export the Google Sheets Gradebook CSV with 1 click.
                </p>
              </div>
            </div>
          )}

          {selectedRole === "admin" && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  1. Google Sites Embedding (Option A vs B)
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Option A: Paste direct URL into Google Sites &quot;By URL&quot; (or
                  Full page embed). Option B: Paste the <code>&lt;iframe&gt;</code> snippet
                  with custom height. Both verified with CSP frame-ancestors.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  2. Chromebook Popup Troubleshooting
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Session cookies use <code>SameSite=None; Secure</code> over HTTPS.
                  If a strict school policy blocks auth popups, students can click
                  &quot;Open Full-Screen in New Tab&quot; or use 1-Click Demo Profiles.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block">
                  3. Cloud Governance &amp; Semester Resets
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Superadmins can elevate teacher roles, review the master
                  Contract Note Audit Ledger, and execute semester-wide S$10,000
                  balance resets. Verify 24/7 uptime at <code>/api/health</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cognitive Science & Pedagogical Architecture Showcase (For Schools, HODs & Sales Partners) */}
      <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/40 p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="space-y-1 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-[11px] font-bold text-indigo-800">
              🎓 For Schools, HODs &amp; Educational Partners · Cognitive Science Architecture
            </span>
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              How EduFinLit Embeds Cognitive Science &amp; Standards-Aligned Mastery Rubrics
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every module in <strong>EduFinLit</strong> is mapped to{" "}
              <strong>OECD/PISA Youth Financial Literacy Competencies</strong>,{" "}
              <strong>Council for Economic Education (CEE) Investing Standards</strong>,{" "}
              <strong>Bloom&apos;s Revised Taxonomy</strong>, and{" "}
              <strong>SOLO Taxonomy</strong> — giving schools measurable proof of
              student financial literacy growth.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sgx-blue px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
            >
              Open Student Learning Passport →
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-50"
            >
              Open Teacher &amp; HOD Impact Report →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5 text-xs">
          {[
            {
              code: "FL-C1",
              title: "Market Mechanics & Order Discipline",
              cog: "Procedural Schema & Worked Examples",
              std: "OECD/PISA Planning · Bloom's Understand & Apply",
              desc: "100-share SGX Board Lots, Bid/Ask spread execution, Tick Size bands, and price-disciplined Limit Orders.",
            },
            {
              code: "FL-C2",
              title: "Transaction Cost & Fee-Drag Math",
              cog: "Sweller's Cognitive Load (Faded Examples)",
              std: "CEE Cost-Benefit Std · Bloom's Apply & Analyze",
              desc: "Sizing orders so SGX + CDP + 9% GST fees (S$10 min brokerage) stay under the 1.50% fee-drag threshold.",
            },
            {
              code: "FL-C3",
              title: "Diversification & Risk Architecture",
              cog: "Counterfactual What-If Mental Modeling",
              std: "OECD/PISA Risk & Reward · Bloom's Analyze & Evaluate",
              desc: "Cross-tier capital allocation across 4 SGX Risk Tiers and Herfindahl-Hirschman Index (1 − HHI) optimization.",
            },
            {
              code: "FL-C4",
              title: "Fundamental Valuation & DRIP",
              cog: "Comparative Elaborative Interrogation",
              std: "CEE Earnings & Compounding · Bloom's Evaluate",
              desc: "Evaluating P/E earnings multiples alongside Tier-1 tax-exempt Dividend Yield and 5-year DRIP compounding.",
            },
            {
              code: "FL-C5",
              title: "Metacognitive Self-Regulation",
              cog: "Pre-Trade Calibration & Active Retrieval",
              std: "Flavell Metacognitive Framework · Bloom's Create",
              desc: "Pre-trade thesis & confidence tagging (1–5), macro stress-testing, and weekly reflective encoding.",
            },
          ].map((item) => (
            <div
              key={item.code}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="inline-block rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                  {item.code}
                </span>
                <h3 className="font-display text-xs font-extrabold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-[11px] font-semibold text-indigo-700">
                  🧠 {item.cog}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <p className="pt-2 border-t border-slate-100 font-mono text-[10px] text-slate-500">
                {item.std}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
