export type HandbookRole = "student" | "teacher" | "admin";

export interface VideoBeat {
  id: string;
  startSec: number;
  endSec: number;
  time: string;
  cue: string;
  callout: string;
  vo: string;
  sceneType:
    | "intro"
    | "login_onboarding"
    | "market_screener"
    | "order_ticket_fee"
    | "candlestick_charts"
    | "level2_depth"
    | "drip_simulator"
    | "ai_copilot_chat"
    | "leaderboard_hhi"
    | "cognitive_passport"
    | "stress_tester"
    | "teacher_class_create"
    | "teacher_roster_sync"
    | "teacher_market_controls"
    | "teacher_dividends"
    | "teacher_heatmap"
    | "teacher_solo_taxonomy"
    | "teacher_comments_export"
    | "admin_google_cloud"
    | "admin_google_sites_embed"
    | "admin_chromebook_session"
    | "admin_governance"
    | "outro";
}

export interface EpisodeData {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  durationSec: number;
  role: HandbookRole;
  targetAudience: string;
  thumbnailDesc: string;
  hook: string;
  challenge: string;
  beats: VideoBeat[];
}

export const EPISODES_DATA: EpisodeData[] = [
  {
    id: "ep1",
    number: "Episode 01",
    title: "Your First S$10,000 on the SGX Market",
    subtitle: "From First Login to Your First T+2 Contract Note",
    duration: "3:30",
    durationSec: 210,
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "Split frame: Glowing S$10,000 virtual balance badge and live DBS candlestick chart with headline: DON'T GAMBLE YOUR S$10K 📉 — MASTER SGX IN 3 MINS",
    hook: "Imagine walking into the Singapore Exchange with S$10,000 in virtual cash to invest in companies you see every day: DBS, Sheng Siong, Singtel, and SIA. No fake tokens—100% authentic SGX market rules.",
    challenge:
      "Sign in to EduFinLit, navigate to /company/OV8.SI, adjust the quantity from 100 to 500 shares, observe how the Fee Drag percentage drops from over 6% to under 1.5%, write a 1-sentence thesis, and execute!",
    beats: [
      {
        id: "ep1-b1",
        startSec: 0,
        endSec: 18,
        time: "0:00 - 0:18",
        cue: "A-Roll Studio Intro (Singapore Dollar Capital Graphic)",
        callout: "S$10,000 Virtual Capital · 20 SGX Blue Chips · 0% Real Risk",
        vo: "Imagine walking into the Singapore Exchange with ten thousand dollars in your pocket. No fake tokens, no fantasy land—ten thousand real Singapore dollars in virtual cash to invest in companies you see every single day: DBS Bank, Sheng Siong supermarkets, Singtel, and Singapore Airlines.",
        sceneType: "intro",
      },
      {
        id: "ep1-b2",
        startSec: 18,
        endSec: 38,
        time: "0:18 - 0:38",
        cue: "Screen Recording: /login page with Google OAuth",
        callout: "Continue with Google (Gmail) · 1-Click Demo Profiles",
        vo: "Head over to EduFinLit. You can sign in instantly with your Google account, or if your teacher has prepared a computer lab demo, simply click your assigned demo profile with one click. No lengthy registration forms, no passwords to forget.",
        sceneType: "login_onboarding",
      },
      {
        id: "ep1-b3",
        startSec: 38,
        endSec: 62,
        time: "0:38 - 1:02",
        cue: "Screen Recording: First-Login Onboarding Modal",
        callout: "Class Join Code (e.g. SGX4E1) · Auto-Provision S$10k Cash",
        vo: "On your first login, pick a trader handle and enter your teacher's Class Join Code—like SGX4E1 or SGXJC1. The moment you confirm, your account is provisioned with exactly S$10,000.00 in cash, and your portfolio is connected to your school's live class leaderboard.",
        sceneType: "login_onboarding",
      },
      {
        id: "ep1-b4",
        startSec: 62,
        endSec: 95,
        time: "1:02 - 1:35",
        cue: "Screen Recording: /dashboard Market Screener",
        callout: "Live SGT Session Clock · 4 Risk Tiers (Safe Bets, Giants, Everyday, High Risk)",
        vo: "Here is your command center: the SGX Market Screener. Notice the live clock at the top right—it tracks actual Singapore Trading Hours: Pre-Open, Morning Open, Midday Break, and Pre-Close. All 20 companies are grouped into 4 intuitive Risk Tiers.",
        sceneType: "market_screener",
      },
      {
        id: "ep1-b5",
        startSec: 95,
        endSec: 130,
        time: "1:35 - 2:10",
        cue: "Screen Recording: /company/OV8.SI Order Ticket",
        callout: "SGX Board Lot = 100 Shares · Sheng Siong @ S$1.58",
        vo: "Let's buy shares of Sheng Siong. On the Singapore Exchange, shares trade in standard bundles called Board Lots of 100 shares. At S$1.58 per share, 100 shares cost S$158.00 gross. But wait! Look closely at the fee breakdown.",
        sceneType: "order_ticket_fee",
      },
      {
        id: "ep1-b6",
        startSec: 130,
        endSec: 165,
        time: "2:10 - 2:45",
        cue: "Screen Recording: Fee Calculation Breakdown Zoom",
        callout: "S$10.00 Min Brokerage + CDP + SGX + 9% GST = 6.94% Fee Drag!",
        vo: "Singapore brokers charge a minimum brokerage fee, typically S$10.00 plus CDP clearing fees and 9% GST. If you only buy 100 shares of a S$1.50 stock, you're paying nearly S$11 in fees—that's a 7% drag! But if you size to 1,000 shares (S$1,580), that same fee becomes less than 0.8%! That is Competency FL-C2: Fee Drag Awareness.",
        sceneType: "order_ticket_fee",
      },
      {
        id: "ep1-b7",
        startSec: 165,
        endSec: 190,
        time: "2:45 - 3:10",
        cue: "Screen Recording: Pre-Trade Thesis & Order Execution",
        callout: "Pre-Trade Thesis & Confidence Tagging (FL-C5) · T+2 Contract Note",
        vo: "Before executing, EduFinLit asks you for your Pre-Trade Thesis and a confidence score from 1 to 5. This metacognitive habit stops emotional impulse trading. Hit submit—and boom! Here is your official T+2 Electronic Contract Note with SGX settlement reference and CDP fees.",
        sceneType: "order_ticket_fee",
      },
      {
        id: "ep1-b8",
        startSec: 190,
        endSec: 210,
        time: "3:10 - 3:30",
        cue: "A-Roll Studio Outro",
        callout: "Episode 1 Complete: Next up Pro Charts & AI Copilot!",
        vo: "You just completed your very first real-world trade. In Episode 2, we will uncover how to use our Socratic AI Copilot, read professional candlestick charts, and turn on the DRIP dividend snowball!",
        sceneType: "outro",
      },
    ],
  },
  {
    id: "ep2",
    number: "Episode 02",
    title: "Pro Charts, AI Copilot & The DRIP Snowball",
    subtitle: "TradingView Indicators, 5-Level Depth & Natural-Language Staging",
    duration: "4:00",
    durationSec: 240,
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "TradingView candlesticks with emerald SMA lines alongside AI chat window staging an order: SMART TRADING VS RANDOM GUESSING 🤖📈",
    hook: "Most beginner apps give you a single squiggly line and leave you guessing. In EduFinLit, you are trading on the exact same institutional charting engine used by top desks on Raffles Place.",
    challenge:
      "Open /copilot, type 'Compare DBS and Singtel dividend yields and stage a 100-share buy for the one with lower P/E', and test how the Socratic Copilot breaks down valuation before staging your order!",
    beats: [
      {
        id: "ep2-b1",
        startSec: 0,
        endSec: 20,
        time: "0:00 - 0:20",
        cue: "A-Roll Studio Intro (Visual comparison of line vs candlestick chart)",
        callout: "Institutional TradingView Engine · Candlesticks vs Simple Lines",
        vo: "Most beginner apps give you a single squiggly line and leave you guessing. In EduFinLit, you are trading on the exact same institutional charting engine used by top desks on Raffles Place: TradingView Lightweight Charts.",
        sceneType: "intro",
      },
      {
        id: "ep2-b2",
        startSec: 20,
        endSec: 55,
        time: "0:20 - 0:55",
        cue: "Screen Recording: /company/D05.SI Candlestick Chart",
        callout: "SMA 20/50 · VWAP · RSI(14) Overbought (>70) / Oversold (<30)",
        vo: "Each candlestick tells the full story of that trading session: the Open, High, Low, and Close. Turn on the SMA 20 and 50 moving averages to see the institutional trend. Check the RSI(14) indicator at the bottom: if it shoots above 70, the stock might be overheated; below 30, it could be oversold.",
        sceneType: "candlestick_charts",
      },
      {
        id: "ep2-b3",
        startSec: 55,
        endSec: 85,
        time: "0:55 - 1:25",
        cue: "Screen Recording: 5-Level Bid/Ask Depth Book",
        callout: "5 Bids vs 5 Asks · Bid/Ask Spread · SGX Minimum Tick Size Bands",
        vo: "Look right below the chart: this is the 5-Level Bid/Ask Depth Book. Stocks don't have one magic price; there is a queue of buyers bidding, and sellers asking. And notice how DBS ticks in 1-cent steps, while stocks under 20 cents, like ISOTeam (ITS.SI), tick in 0.1-cent steps.",
        sceneType: "level2_depth",
      },
      {
        id: "ep2-b4",
        startSec: 85,
        endSec: 125,
        time: "1:25 - 2:05",
        cue: "Screen Recording: 5-Year DRIP Simulator",
        callout: "Tax-Exempt Dividends · Reinvesting Cash Payouts for Exponential Share Accumulation",
        vo: "Now here is the real secret of Singapore blue chips: Tax-Exempt Dividends. Singapore has no capital gains tax and no dividend tax on SGX-listed shares! On the DBS page, open the 5-Year DRIP Simulator. Watch how reinvesting quarterly dividends automatically compounds your share count.",
        sceneType: "drip_simulator",
      },
      {
        id: "ep2-b5",
        startSec: 125,
        endSec: 170,
        time: "2:05 - 2:50",
        cue: "Screen Recording: /copilot Natural Language Staging",
        callout: "Natural Language Prompting · Staged Order Preview Cards",
        vo: "Now let's visit your personal trading analyst: the Agentic AI Copilot at /copilot. You can talk to it in natural English. Type: 'Stage an order to buy 100 shares of Singtel at market.' It doesn't execute blindly; it stages an interactive Order Preview Card right in the chat!",
        sceneType: "ai_copilot_chat",
      },
      {
        id: "ep2-b6",
        startSec: 170,
        endSec: 210,
        time: "2:50 - 3:30",
        cue: "Screen Recording: Staged Order Inline Adjusters",
        callout: "[-1 Lot] / [+1 Lot] · [Switch to SELL/BUY] · EduFinLit Socratic Learning Guardrails",
        vo: "Inside this staged card, you can adjust quantities with one tap—click +1 Lot or -1 Lot—or switch from BUY to SELL. And if you ask it for reckless stock tips, our EduFinLit Socratic Learning Guardrails intervene to ask Socratic questions about diversification and valuation.",
        sceneType: "ai_copilot_chat",
      },
      {
        id: "ep2-b7",
        startSec: 210,
        endSec: 240,
        time: "3:30 - 4:00",
        cue: "A-Roll Studio Outro",
        callout: "Technical Indicators + Socratic AI Coaching = Institutional Discipline",
        vo: "Combining pro technical indicators with Socratic AI coaching transforms you from a nervous gambler into a thoughtful, institutional-grade investor. Next up in Episode 3: How to beat the class leaderboard using 1 - HHI!",
        sceneType: "outro",
      },
    ],
  },
  {
    id: "ep3",
    number: "Episode 03",
    title: "How to Beat the Leaderboard Using 1 − HHI",
    subtitle: "The Smart Investor Score & The 5-Pillar Mastery Rubric",
    duration: "3:15",
    durationSec: 195,
    role: "student",
    targetAudience: "Secondary & JC Students",
    thumbnailDesc:
      "Podium graphic: 4-stock diversified portfolio beating single-stock gambler with headline: HOW 1 FORMULA CRUSHES GAMBLERS ON THE LEADERBOARD 🏆",
    hook: "In almost every beginner trading game, whoever gambles all their money on a single penny stock and gets lucky ends up in first place. In EduFinLit, that strategy will actually cause you to lose.",
    challenge:
      "Open /portfolio, check your current HHI score, then answer 1 Active Retrieval Quiz question to test your fee-drag calculation speed!",
    beats: [
      {
        id: "ep3-b1",
        startSec: 0,
        endSec: 22,
        time: "0:00 - 0:22",
        cue: "A-Roll Studio Intro (Casino roulette crossed out)",
        callout: "Smart Investor Score = Return × (1 + (1 - HHI))",
        vo: "In almost every beginner trading game, whoever gambles all their money on a single penny stock and gets lucky ends up in first place. That teaches terrible real-world habits. In EduFinLit, our Smart Investor Score rewards true portfolio management.",
        sceneType: "intro",
      },
      {
        id: "ep3-b2",
        startSec: 22,
        endSec: 65,
        time: "0:22 - 1:05",
        cue: "Screen Recording: /leaderboard Calculations",
        callout: "Gambler (1 Stock, HHI 1.0) = 5.0 pts vs Diversified (4 Stocks, HHI 0.25) = 8.75 pts",
        vo: "Look at the leaderboard. Rankings are determined by your Smart Investor Score: portfolio return multiplied by 1 plus your diversification index, or 1 minus HHI. If you spread across 4 balanced companies, your HHI drops to 0.25, giving you a massive 1.75x multiplier that crushes single-stock gamblers!",
        sceneType: "leaderboard_hhi",
      },
      {
        id: "ep3-b3",
        startSec: 65,
        endSec: 110,
        time: "1:05 - 1:50",
        cue: "Screen Recording: /portfolio Cognitive Learning Passport",
        callout: "5-Pillar Rubric: FL-C1 to FL-C5 · OECD/PISA Competencies",
        vo: "Now open your Student Cognitive Learning Passport on /portfolio. EduFinLit tracks your growth across 5 foundational competencies: Order Discipline, Fee Drag Control, Diversification, Valuation & DRIP, and Metacognitive Reflection.",
        sceneType: "cognitive_passport",
      },
      {
        id: "ep3-b4",
        startSec: 110,
        endSec: 150,
        time: "1:50 - 2:30",
        cue: "Screen Recording: Worked Examples & Retrieval Quizzes",
        callout: "Sweller's Cognitive Load Theory · Faded Worked Examples & Retrieval Quizzes",
        vo: "Learning science shows that you don't master investing by reading passive textbooks; you learn through worked examples and active retrieval practice. Test your understanding right inside the passport with bite-sized scenario questions.",
        sceneType: "cognitive_passport",
      },
      {
        id: "ep3-b5",
        startSec: 150,
        endSec: 175,
        time: "2:30 - 2:55",
        cue: "Screen Recording: Macro Stress-Tester",
        callout: "Macroeconomic Stress-Testing: SGD Tightening, Semiconductor Boom, Tourism Shock",
        vo: "Wondering how your portfolio will handle a sudden global shock? Trigger the Macroeconomic Stress-Tester. Pick a scenario and watch the AI engine recalculate your portfolio's resilience sector by sector.",
        sceneType: "stress_tester",
      },
      {
        id: "ep3-b6",
        startSec: 175,
        endSec: 195,
        time: "2:55 - 3:15",
        cue: "A-Roll Studio Outro",
        callout: "Submit Weekly Reflection on /portfolio to claim your badge!",
        vo: "Don't forget to submit your weekly reflection before Friday closing. In Episode 4, we switch over to our teachers and show how any educator can launch a class in under 3 minutes with zero finance background!",
        sceneType: "outro",
      },
    ],
  },
  {
    id: "ep4",
    number: "Episode 04",
    title: "No Finance Degree Needed: Teacher 3-Minute Classroom Launch",
    subtitle: "Class Join Codes, Odd-Lot Mode & Weekly Challenges",
    duration: "3:30",
    durationSec: 210,
    role: "teacher",
    targetAudience: "Teachers, HODs & Educators",
    thumbnailDesc:
      "Teacher smiling in front of smart classroom board showing Teacher Console: TEACH FINANCIAL LITERACY LIKE A PRO — 3-MINUTE ZERO-PREP LAUNCH 👩‍🏫✨",
    hook: "If you are a teacher tasked with running a financial literacy module, you might feel anxious about explaining market microstructure. With EduFinLit, you need zero financial background.",
    challenge:
      "In /admin, create a test class named 'Demo Class A', generate a Join Code, and toggle the 1-Share Odd-Lot switch to see how your students' order ticket updates in real time!",
    beats: [
      {
        id: "ep4-b1",
        startSec: 0,
        endSec: 25,
        time: "0:00 - 0:25",
        cue: "A-Roll Studio Intro (Classroom b-roll)",
        callout: "0 Finance Degree Needed · 100% Automated Calculations · 3-Min Setup",
        vo: "If you are a teacher tasked with running a financial literacy or economics module, you might feel anxious about explaining complex market microstructure or managing student accounts. With EduFinLit, you need zero financial background. The platform automates every calculation.",
        sceneType: "intro",
      },
      {
        id: "ep4-b2",
        startSec: 25,
        endSec: 55,
        time: "0:25 - 0:55",
        cue: "Screen Recording: /admin Class Groups",
        callout: "Create Class Group · Auto 6-Character Join Code (e.g. SGX4B)",
        vo: "Sign in with your teacher credentials and head to /admin. Click Create Class Group, type your class name—for example, Sec 4 Commercial Studies B—and the system automatically issues a 6-character Class Join Code. Simply write this code on your whiteboard or Google Classroom stream.",
        sceneType: "teacher_class_create",
      },
      {
        id: "ep4-b3",
        startSec: 55,
        endSec: 95,
        time: "0:55 - 1:35",
        cue: "Screen Recording: Google Workspace Roster Import",
        callout: "Google Workspace CSV Roster Import · Bulk Provision S$10,000",
        vo: "Want to set up your entire cohort in advance? Use our Google Workspace Roster Sync. Copy the student email column straight from your school spreadsheet or Google Classroom roster, paste it in, and click Import. Every student account is instantly provisioned.",
        sceneType: "teacher_roster_sync",
      },
      {
        id: "ep4-b4",
        startSec: 95,
        endSec: 135,
        time: "1:35 - 2:15",
        cue: "Screen Recording: SGX Market Controls",
        callout: "1-Share Odd-Lot Mode · Realistic Fees vs Flat S$10 · Pause Class Trading",
        vo: "In the SGX Market Controls card: Teaching younger students? Turn ON 1-Share Odd-Lot Mode so students can trade single shares. Teaching upper secondary or JC economics? Turn on Realistic SGX Fees to teach real-world fee drag. And toggle Pause Class Trading to freeze trading during direct instruction!",
        sceneType: "teacher_market_controls",
      },
      {
        id: "ep4-b5",
        startSec: 135,
        endSec: 170,
        time: "2:15 - 2:50",
        cue: "Screen Recording: Distribute Dividends Button",
        callout: "Distribute Quarterly Tax-Exempt Cash Dividends with 1 Click",
        vo: "Want to demonstrate corporate actions in action? Click Distribute Quarterly Cash Dividends. In one second, the system scans every active holding in your class and credits cash dividends directly to student portfolios.",
        sceneType: "teacher_dividends",
      },
      {
        id: "ep4-b6",
        startSec: 170,
        endSec: 195,
        time: "2:50 - 3:15",
        cue: "Screen Recording: Weekly Challenges Tab",
        callout: "Launch Weekly Classroom Challenges: 'Everyday Brands' & 'ESG Infrastructure'",
        vo: "Keep student engagement high every week by launching Weekly Classroom Challenges. Challenges guide students toward structured, intentional research rather than aimless clicking.",
        sceneType: "teacher_class_create",
      },
      {
        id: "ep4-b7",
        startSec: 195,
        endSec: 210,
        time: "3:15 - 3:30",
        cue: "A-Roll Studio Outro",
        callout: "3 Minutes, Zero Prep: Your Class is Ready to Trade!",
        vo: "That's it! Three minutes, zero prep, and your class is ready to trade. In Episode 5, we will explore how to assess student learning and export printable report cards with zero manual grading!",
        sceneType: "outro",
      },
    ],
  },
  {
    id: "ep5",
    number: "Episode 05",
    title: "Grading Financial Literacy & SOLO Taxonomy",
    subtitle: "The 5-Pillar Competency Heatmap, Impact Reports & Google Sheets Export",
    duration: "3:45",
    durationSec: 225,
    role: "teacher",
    targetAudience: "Teachers, HODs & School Leadership",
    thumbnailDesc:
      "Competency heatmap matrix with student mastery scores & executive PDF report: GRADING FINANCIAL LITERACY MADE EFFORTLESS 📊🎓",
    hook: "The hardest part of teaching financial literacy has always been assessment. How do you grade a student if the market crashes through no fault of their own? You grade cognitive decision quality.",
    challenge:
      "Open /admin, scroll to the Class Competency Heatmap, click any student name, and copy the auto-generated formative comment directly to your clipboard!",
    beats: [
      {
        id: "ep5-b1",
        startSec: 0,
        endSec: 25,
        time: "0:00 - 0:25",
        cue: "A-Roll Studio Intro (Grading rubrics transformation)",
        callout: "Don't Grade Market Luck ➔ Grade Cognitive Decision Quality",
        vo: "The hardest part of teaching financial literacy has always been assessment. How do you grade a student if the market crashes through no fault of their own? The answer is: you don't grade market luck—you grade cognitive decision quality.",
        sceneType: "intro",
      },
      {
        id: "ep5-b2",
        startSec: 25,
        endSec: 70,
        time: "0:25 - 1:10",
        cue: "Screen Recording: Class Competency Heatmap",
        callout: "5-Pillar Competency Heatmap: FL-C1 to FL-C5 · Cohort Mastery Analysis",
        vo: "Inside the Teacher Console, open the Class 5-Pillar Competency Heatmap. Every student's activity is automatically evaluated across our 5 competencies. At a single glance, you can identify which students need help with position sizing and which have achieved complete mastery.",
        sceneType: "teacher_heatmap",
      },
      {
        id: "ep5-b3",
        startSec: 70,
        endSec: 115,
        time: "1:10 - 1:55",
        cue: "Screen Recording: Biggs' SOLO Taxonomy Breakdown",
        callout: "Biggs' SOLO Taxonomy: Pre-structural ➔ Unistructural ➔ Relational ➔ Extended Abstract",
        vo: "EduFinLit anchors this data in Biggs' SOLO Taxonomy. When a student progresses from Unistructural—buying just one stock—to Relational, where they deliberately balance defensive blue chips with growth stocks to minimize HHI, you have concrete proof of higher-order cognitive development.",
        sceneType: "teacher_solo_taxonomy",
      },
      {
        id: "ep5-b4",
        startSec: 115,
        endSec: 160,
        time: "1:55 - 2:40",
        cue: "Screen Recording: Formative Comment Generator",
        callout: "Automated Formative Report Card Comments Generator",
        vo: "Writing formative report card comments used to take hours. EduFinLit generates individualized, standards-aligned formative comments automatically. Each comment identifies the student's strongest competency, current SOLO stage, and next-step learning goal.",
        sceneType: "teacher_comments_export",
      },
      {
        id: "ep5-b5",
        startSec: 160,
        endSec: 195,
        time: "2:40 - 3:15",
        cue: "Screen Recording: Print School Impact Report (PDF)",
        callout: "Print School Impact Report (PDF) · Board & HOD Ready",
        vo: "Need to report back to your Head of Department, Principal, or school board? Click Print School Impact Report. It produces a polished, executive PDF report summarizing cohort engagement, fee-drag discipline, and competency distribution.",
        sceneType: "teacher_comments_export",
      },
      {
        id: "ep5-b6",
        startSec: 195,
        endSec: 225,
        time: "3:15 - 3:45",
        cue: "Screen Recording: Google Sheets Gradebook CSV Export",
        callout: "1-Click Export to Google Sheets Gradebook & Rubric CSV",
        vo: "Finally, with 1 click on Export Google Sheets Gradebook, all student data, scores, and comments export directly into a standard CSV file ready to import into your school's LMS or gradebook.",
        sceneType: "teacher_comments_export",
      },
    ],
  },
  {
    id: "ep6",
    number: "Episode 06",
    title: "1-Click Google Sites Embed & IT Governance",
    subtitle: "Embedding in sites.google.com, Role Management & Cloud Health",
    duration: "3:00",
    durationSec: 180,
    role: "admin",
    targetAudience: "School IT Admins, Superadmins & EdTech Leads",
    thumbnailDesc:
      "Google Sites interface embedding EduFinLit with green verified lock icon: 1-CLICK GOOGLE SITES EMBED FOR SCHOOLS 🌐🔒",
    hook: "If you are a school IT administrator or EdTech lead, your top priorities are security, uptime, and ease of deployment. EduFinLit is engineered as a 100% Google Cloud application.",
    challenge:
      "Open /launch, click the 'Copy URL' button under Option A, open a new browser window, and test how smoothly the platform loads with full HTTPS security!",
    beats: [
      {
        id: "ep6-b1",
        startSec: 0,
        endSec: 20,
        time: "0:00 - 0:20",
        cue: "A-Roll Studio Intro (Google Cloud architecture graphic)",
        callout: "100% Google Cloud Native · Firebase Hosting · Zero Server Maintenance",
        vo: "If you are a school IT administrator or EdTech lead, your top priorities are security, uptime, and ease of deployment. EduFinLit is engineered as a 100% Google Cloud application hosted on Firebase Hosting in the asia-southeast1 Singapore region. You do not need to manage any servers.",
        sceneType: "intro",
      },
      {
        id: "ep6-b2",
        startSec: 20,
        endSec: 60,
        time: "0:20 - 1:00",
        cue: "Screen Recording: /launch Embed Options",
        callout: "Option A: Direct URL Embed · Option B: HTML <iframe> Snippet",
        vo: "Navigate to /launch—our Google Sites & Launch Center. You have two foolproof ways to embed: Option A is as simple as copying your live cloud URL and pasting it into Google Sites under Insert ➔ Embed ➔ By URL. Option B provides a ready-to-use HTML iframe snippet.",
        sceneType: "admin_google_sites_embed",
      },
      {
        id: "ep6-b3",
        startSec: 60,
        endSec: 95,
        time: "1:00 - 1:35",
        cue: "Screen Recording: sites.google.com Editor",
        callout: "frame-ancestors sites.google.com CSP Verified · 1-Click Publishing",
        vo: "In your Google Site, simply create a new page named 'SGX Edu-Trader', choose Full page embed, paste your live link, and hit Publish. Because our server headers include frame-ancestors sites.google.com, the simulator loads with zero embedding blocks.",
        sceneType: "admin_google_sites_embed",
      },
      {
        id: "ep6-b4",
        startSec: 95,
        endSec: 125,
        time: "1:35 - 2:05",
        cue: "Screen Recording: Chromebook Policy Troubleshooting",
        callout: "SameSite=None; Secure Session Cookies · 1-Click Demo Profiles Fallback",
        vo: "What about school Chromebooks with strict popup restrictions? Our authentication session cookie is configured with SameSite=None; Secure. If strict policies block external popups, students can click 'Open Full-Screen in New Tab' or sign in via 1-Click Demo Profiles with zero popups!",
        sceneType: "admin_chromebook_session",
      },
      {
        id: "ep6-b5",
        startSec: 125,
        endSec: 155,
        time: "2:05 - 2:35",
        cue: "Screen Recording: /admin Superadmin Governance",
        callout: "Role Governance (Student ➔ Teacher ➔ Superadmin) · Semester S$10k Reset",
        vo: "For school IT leads managing user governance: Superadmin accounts can elevate any teacher account with one click. You also have access to the master Contract Note Audit Ledger and the semester-wide Reset All Student Portfolios button.",
        sceneType: "admin_governance",
      },
      {
        id: "ep6-b6",
        startSec: 155,
        endSec: 180,
        time: "2:35 - 3:00",
        cue: "A-Roll Studio Outro",
        callout: "GET /api/health ➔ 200 OK · 24/7 Cloud Uptime Verified",
        vo: "Check your real-time cloud health at /api/health anytime. With 24/7 uptime, automated backups, and complete Google Workspace integration, EduFinLit is ready for your entire school cohort. Welcome to the future of financial education!",
        sceneType: "outro",
      },
    ],
  },
];

export interface HandbookSection {
  number: string;
  title: string;
  summary: string;
  contentMarkdown: string;
}

export interface RoleHandbookDoc {
  role: HandbookRole;
  title: string;
  subtitle: string;
  targetAudience: string;
  version: string;
  sections: HandbookSection[];
}

export const ROLE_HANDBOOKS: Record<HandbookRole, RoleHandbookDoc> = {
  student: {
    role: "student",
    title: "Student Field Handbook: Navigating the SGX Market Like an Institutional Trader",
    subtitle: "Complete Operational Manual & Mathematical Cheat-Sheet for Singapore Secondary & JC Students",
    targetAudience: "Singapore Secondary 1–4, Junior College 1–2, and Polytechnic Students",
    version: "v2.5 (Institutional Daylight Edition)",
    sections: [
      {
        number: "1.0",
        title: "Starting Capital & Account Provisioning",
        summary: "S$10,000.00 cash provisioning, Google Workspace login, and joining class cohorts.",
        contentMarkdown: `### 1.1 Account Setup & Cash Allocation
Every student begins with exactly **S$10,000.00 virtual capital** provisioned directly into your secure portfolio ledger.
- **Single Sign-On (SSO):** Sign in via Google Workspace / Gmail with one click. No separate passwords required.
- **Class Cohort Connection:** On initial login, enter your teacher's 6-character Class Join Code (e.g., \`SGX4E1\`) to link your portfolio to your school's class cohort and leaderboard.
- **Cash vs Portfolio Value:** Your Cash Balance is uninvested capital earning 0% nominal return. Your Net Portfolio Value equals Cash plus the current mark-to-market market value of all held stocks.`,
      },
      {
        number: "2.0",
        title: "SGX Market Microstructure: Board Lots & Minimum Tick Sizes",
        summary: "Understanding 100-share bundles, bid/ask spreads, and exact price movement ticks.",
        contentMarkdown: `### 2.1 The SGX Board Lot Rule (100 Shares)
On the Singapore Exchange (SGX), standard equities trade in bundles called **Board Lots of 100 shares**.
- When you place an order, quantity must be in multiples of 100 shares (e.g., 100, 200, 500, 1,000) unless your teacher activates *1-Share Odd-Lot Mode*.
- *Example:* Buying DBS Group (\`D05.SI\`) at S$36.20 requires a minimum order of 100 shares = **S$3,620.00** gross value.

### 2.2 SGX Minimum Tick Size Schedule
Stock prices do not move continuously; they move in discrete increments called **Ticks**:
- **Share Price Below S$0.200:** Tick size is **S$0.001 (0.1 cent)** (e.g., ISOTeam \`ITS.SI\` at S$0.038 moves to S$0.039).
- **Share Price S$0.200 to S$1.990:** Tick size is **S$0.005 (0.5 cents)** (e.g., Sheng Siong \`OV8.SI\` at S$1.580 moves to S$1.585).
- **Share Price S$2.000 and Above:** Tick size is **S$0.010 (1.0 cent)** (e.g., Keppel \`BN4.SI\` at S$6.50 moves to S$6.51).`,
      },
      {
        number: "3.0",
        title: "The Silent Portfolio Killer: SGX Realistic Fee Drag Math",
        summary: "Calculating minimum commission, CDP clearing, SGX trading fee, GST, and position sizing.",
        contentMarkdown: `### 3.1 Singapore Brokerage Fee Formula
Real trading incurs four distinct statutory fees:
1. **Brokerage Commission:** 0.08% of gross trade value, subject to a statutory minimum of **S$10.00**.
2. **CDP Clearing Fee:** 0.0325% of gross value.
3. **SGX Trading Access Fee:** 0.0075% of gross value.
4. **Singapore Goods & Services Tax (GST):** 9% applied across all three fees above.

\`\`\`
Total Fees = (Brokerage + CDP + SGX) × 1.09
Fee Drag (%) = (Total Fees / Gross Trade Value) × 100%
\`\`\`

### 3.2 The S$1,500 Position Sizing Rule of Thumb
- **The Micro-Order Trap:** If you buy 100 shares of a S$1.50 stock (\`S$150.00\` gross value), you pay the **S$10.00 min fee + CDP + SGX + GST = S$10.96**. Your fee drag is **7.31%**! The stock must rise 7.4% just for you to break even.
- **The Institutional Solution:** By sizing orders to at least **S$1,500.00** (e.g., 1,000 shares of Sheng Siong), total fees are S$11.60, reducing fee drag to **0.77%**. Always aim for fee drag below 1.5%!`,
      },
      {
        number: "4.0",
        title: "Beating the Leaderboard: Smart Investor Score & 1 − HHI",
        summary: "Why diversification beats penny-stock gambling on the class podium.",
        contentMarkdown: `### 4.1 The Herfindahl-Hirschman Index (HHI)
In EduFinLit, class leaderboard rank is not determined by raw luck or gambling on a single volatile stock. It is governed by the **Smart Investor Score**:

\`\`\`
Smart Investor Score = Portfolio Return (%) × (1 + (1 − HHI))
\`\`\`

- **HHI (Concentration Index):** Sum of squared weights of all open positions: $HHI = \\sum (w_i)^2$.
- **Gambler Portfolio (100% in 1 stock):** $HHI = (1.0)^2 = 1.0$. Diversification index $(1 - HHI) = 0.0$. Multiplier = **1.0x**.
- **Balanced Portfolio (4 stocks @ 25% each):** $HHI = 4 \\times (0.25)^2 = 0.25$. Diversification index $(1 - HHI) = 0.75$. Multiplier = **1.75x**!
- *Classroom Impact:* A 10% return in a diversified portfolio scores **17.50 points**, soundly beating a 12% return from a single-stock gambler (12.00 points).`,
      },
      {
        number: "5.0",
        title: "Metacognitive Trade Journaling & The 5-Pillar Rubric",
        summary: "Pre-trade hypotheses, confidence calibration, and the Student Cognitive Passport.",
        contentMarkdown: `### 5.1 Pre-Trade Hypothesis Tagging (FL-C5)
Before any order can be confirmed, the order ticket requires:
1. **Investment Thesis Tag:** Selecting your primary rationale (e.g., *Dividend Aristocrat Accumulation*, *Value Reversion*, *Defensive Consumer Staple*).
2. **Confidence Calibration (1 to 5):** Rating your objective conviction level.
3. **Weekly Reflection:** Submitting a 2-sentence metacognitive reflection on \`/portfolio\` each Friday to earn the *Reflective Investor* badge and boost your cognitive mastery score.`,
      },
    ],
  },
  teacher: {
    role: "teacher",
    title: "Teacher & HOD Implementation Manual: Zero-Prep Financial Literacy Mastery",
    subtitle: "Curriculum Integration, 5-Pillar Competency Heatmaps, and Automated SOLO Taxonomy Grading",
    targetAudience: "Singapore Secondary School Teachers, JC Economics Tutors, HODs, and Polytechnic Lecturers",
    version: "v2.5 (Institutional Daylight Edition)",
    sections: [
      {
        number: "1.0",
        title: "3-Minute Zero-Prep Classroom Launch",
        summary: "How any teacher can launch an active trading class in 180 seconds with zero finance background.",
        contentMarkdown: `### 1.1 Step-by-Step Classroom Choreography
1. **Sign In to Teacher Console:** Go to \`https://sgx-edu-trader-2-sg.web.app/admin\` with your school Google account.
2. **Create Class Group:** Click **Create Class Group**, type your class name (e.g., *Sec 3 Aspiration Econs*), and the platform generates a unique 6-character Join Code (e.g., \`SGX3A\`).
3. **Share with Students:** Write the Join Code on your whiteboard or paste it into your Google Classroom stream.
4. **Google Workspace CSV Sync:** Have a large cohort? Click **Roster Sync**, paste the student email column from your school spreadsheet, and click **Bulk Provision**. All accounts receive S$10,000 virtual capital instantly.`,
      },
      {
        number: "2.0",
        title: "Pedagogical SGX Market Controls",
        summary: "Toggling 1-Share Odd Lots, realistic fee drag, and trading freezes during direct instruction.",
        contentMarkdown: `### 2.1 Fine-Tuning the Learning Simulation
In the **Teacher Console (\`/admin\`)**, you control authentic market switches:
- **1-Share Odd-Lot Mode:** Turn ON for lower secondary classes so students can trade single shares of higher-priced stocks like DBS. Turn OFF for upper secondary / JC to enforce standard 100-share SGX Board Lots.
- **Fee Simulation Mode:** Switch between *SGX Realistic Fees* (teaches real fee drag) and *Flat S$10.00* (for basic arithmetic lessons).
- **Pause Class Trading:** Freezes execution across all student accounts during lectures or class discussions so students focus on teaching.
- **Distribute Quarterly Cash Dividends:** 1-click credits tax-exempt dividends to all active student holdings, demonstrating income investing in real time.`,
      },
      {
        number: "3.0",
        title: "The 5-Pillar Cognitive Science Rubric & SOLO Taxonomy",
        summary: "Standards-aligned competency framework (FL-C1 to FL-C5) aligned with OECD/PISA and Biggs' SOLO.",
        contentMarkdown: `### 3.1 The 5 Evaluated Competencies
EduFinLit grades **cognitive decision quality**, not random market luck:
- **FL-C1 (Execution & Order Discipline):** Understanding board lots, limit prices vs market execution, and session timing.
- **FL-C2 (Fee Drag Awareness & Sizing):** Minimizing the drag of minimum commission fees through disciplined sizing.
- **FL-C3 (Portfolio Diversification & HHI):** Spreading exposure across sectors to avoid catastrophic single-stock risk.
- **FL-C4 (Valuation & DRIP Snowball):** Assessing P/E multiples, dividend yields, and long-term compounding.
- **FL-C5 (Metacognitive Reflection & Calibration):** Pre-trade thesis articulation and post-trade reflection accuracy.

### 3.2 Biggs' SOLO Taxonomy Progression
- **Pre-structural (0-19):** Random clicking, zero awareness of fee drag or risk.
- **Unistructural (20-39):** Executes single-share orders or buys 1 familiar brand without diversification.
- **Multistructural (40-59):** Buys multiple companies across sectors, but sizes inefficiently.
- **Relational (60-79):** Deliberately balances defensives with cyclicals, optimizes fee drag under 1.5%, and articulates hypotheses.
- **Extended Abstract (80-100):** Stress-tests against macro shocks, explains DRIP compounding, and shows calibrated risk estimation.`,
      },
      {
        number: "4.0",
        title: "Class Competency Heatmap & 1-Click Formative Comments",
        summary: "Cohort mastery matrix, individualized report card comments, and Google Sheets Gradebook export.",
        contentMarkdown: `### 4.1 Automated Assessment & Export
- **Class Competency Heatmap:** Real-time matrix in \`/admin\` color-coding every student across FL-C1 to FL-C5. Identify students needing immediate intervention in seconds.
- **1-Click Formative Comments:** Click any student to generate a standards-aligned formative comment for report cards and parent teacher meetings.
- **Export to Google Sheets Gradebook:** 1-click CSV export with student name, email, net value, P&L, HHI, Smart Score, 5-Pillar scores, and qualitative comments ready for school LMS import.
- **Print School Impact Report:** Formats a high-level executive PDF summary ready for HOD, Principal, or Ministry reporting.`,
      },
    ],
  },
  admin: {
    role: "admin",
    title: "Superadmin & IT Operations Manual: Cloud Governance & Deployment",
    subtitle: "Google Cloud Infrastructure, sites.google.com Iframe Integration, and Cloud Run Crons",
    targetAudience: "School IT Admins, EdTech Coordinators, Google Workspace Administrators",
    version: "v2.5 (Institutional Daylight Edition)",
    sections: [
      {
        number: "1.0",
        title: "100% Google Cloud Ecosystem Architecture",
        summary: "Zero third-party vendor lock-in: Firebase Hosting, Cloud Run, Firestore, and Gemini.",
        contentMarkdown: `### 1.1 Architecture Highlights
EduFinLit is built entirely within the approved Google Cloud / Firebase ecosystem:
- **Hosting & Compute:** Firebase App Hosting & Google Cloud Run in \`asia-southeast1\` (Singapore).
- **Database:** Google Cloud Firestore in Datastore Native mode with atomic transactions.
- **Authentication:** Google Identity Platform / Firebase Auth with Gmail OAuth and HTTP-only session cookies.
- **AI Engine:** \`@google/genai\` running \`gemini-2.5-flash\` with multi-turn Socratic prompts.
- **No Vercel, No Supabase:** 100% compliant with strict institutional and school IT policies.`,
      },
      {
        number: "2.0",
        title: "Google Sites Embedding (Option A vs Option B)",
        summary: "Publishing inside sites.google.com with verified Content-Security-Policy frame-ancestors.",
        contentMarkdown: `### 2.1 Embedding into sites.google.com
- **CSP Verification:** Server response headers include:
  \`\`\`
  Content-Security-Policy: frame-ancestors 'self' https://sites.google.com https://*.google.com https://*.googleusercontent.com https://classroom.google.com;
  \`\`\`
- **Option A (Direct URL Embed):** In Google Sites, click **Insert ➔ Embed ➔ By URL**, paste \`https://sgx-edu-trader-2-sg.web.app\`, choose **Full page embed**, and click **Insert**.
- **Option B (HTML Snippet):** In Google Sites, choose **Embed ➔ Embed Code**, and paste the responsive iframe snippet provided on \`/launch\`.`,
      },
      {
        number: "3.0",
        title: "Chromebook Cookie Policies & Popup Troubleshooting",
        summary: "Handling strict school Chromebook web filters with SameSite=None and 1-Click Demo Profiles.",
        contentMarkdown: `### 3.1 Authentication Security
- **SameSite=None; Secure:** The session cookie \`__session\` is configured for seamless cross-site iframe authentication inside Google Sites.
- **Chromebook Popup Filter Fallback:** If a school Chromebook policy restricts external OAuth popups, provide students with the **1-Click Demo Profiles** on \`/login\`, which generate authenticated sessions without triggering external popups.
- **Direct Tab Fallback:** Students can also click **"Open Full-Screen in New Tab"** at the top right of the Google Sites page.`,
      },
      {
        number: "4.0",
        title: "Cloud Cron Schedulers & Semester Resets",
        summary: "Automated 15-minute price updates, daily equity curve snapshots, and cohort resets.",
        contentMarkdown: `### 4.1 Scheduled Cloud Operations
- **Market Price Sync:** \`GET /api/cron/prices\` invoked every 15 minutes during SGX trading hours (09:00 - 17:00 SGT) via Google Cloud Scheduler.
- **Portfolio Snapshots:** \`GET /api/cron/snapshot\` executed at 17:05 SGT to calculate daily closing equity curves and HHI scores.
- **Semester Reset Tool:** In \`/admin\`, superadmins have access to the **Reset All Student Portfolios to S$10,000.00** tool with irreversible confirmation protection.
- **Cloud Health Verification:** Endpoint \`GET /api/health\` returns HTTP 200 OK with memory, uptime, and database connection status.`,
      },
    ],
  },
};
