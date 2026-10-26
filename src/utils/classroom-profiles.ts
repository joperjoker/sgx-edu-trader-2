export interface ClassroomJourneyStep {
  step: number;
  label: string;
  description: string;
  href: string;
  badge?: string;
}

export interface ClassroomSampleProfile {
  uid: string;
  email: string;
  name: string;
  shortLabel: string;
  role: "student" | "teacher" | "superadmin";
  roleBadge: string;
  statHighlight: string;
  summary: string;
  defaultRoute: string;
  avatarColor: string;
  journeySteps: ClassroomJourneyStep[];
}

export const CLASSROOM_SAMPLE_PROFILES: ClassroomSampleProfile[] = [
  {
    uid: "user-student-1",
    email: "student1@gmail.com",
    name: "Ryan Koh",
    shortLabel: "Ryan (Student)",
    role: "student",
    roleBadge: "Sec 4 Student · Active Trader",
    statHighlight: "S$10,342.50 Net Value · 4 SGX Stocks",
    summary:
      "Active student portfolio holding DBS, Singtel, Sheng Siong & iFAST with T+2 contract notes.",
    defaultRoute: "/dashboard",
    avatarColor: "blue",
    journeySteps: [
      {
        step: 1,
        label: "Screen 20 SGX Counters",
        description:
          "Inspect 20 blue-chips, 100-share board lots, and bid-ask spreads.",
        href: "/dashboard",
        badge: "Market Screener",
      },
      {
        step: 2,
        label: "Stage Trade with AI Copilot",
        description:
          "Simulate portfolio impact and test trade theses with Gemini AI.",
        href: "/copilot",
        badge: "AI Copilot",
      },
      {
        step: 3,
        label: "Inspect T+2 Contract Notes",
        description:
          "Review CDP clearing, fee drag breakdown, and 5-Pillar passport.",
        href: "/portfolio",
        badge: "Portfolio & CDP",
      },
    ],
  },
  {
    uid: "user-student-2",
    email: "chloe.ng@gmail.com",
    name: "Chloe Ng",
    shortLabel: "Chloe (Leaderboard #1)",
    role: "student",
    roleBadge: "Sec 4 Student · Diversification Leader",
    statHighlight: "S$10,618.20 Net Value · #1 Smart Score",
    summary:
      "Top-ranked student demonstrating high 1 − HHI diversification and dividend compounding.",
    defaultRoute: "/leaderboard",
    avatarColor: "emerald",
    journeySteps: [
      {
        step: 1,
        label: "Compare 1 − HHI Smart Scores",
        description:
          "Inspect class ranking weighted by diversification & risk-adjusted return.",
        href: "/leaderboard",
        badge: "Leaderboard #1",
      },
      {
        step: 2,
        label: "Run 5-Year DRIP Snowball",
        description:
          "Model dividend reinvestment compounding on DBS Group Holdings.",
        href: "/company/D05.SI",
        badge: "DRIP Calculator",
      },
      {
        step: 3,
        label: "Test Macro Stress-Tester",
        description:
          "Simulate interest rate shocks and inflation against balanced holdings.",
        href: "/portfolio",
        badge: "Stress-Tester",
      },
    ],
  },
  {
    uid: "user-teacher-1",
    email: "teacher@sgxedu.sg",
    name: "Ms. Rachel Lim",
    shortLabel: "Ms. Lim (HOD / YH)",
    role: "teacher",
    roleBadge: "Head of Department / Year Head (HOD / YH)",
    statHighlight: "5-Pillar Heatmap · 1-Click Dividends",
    summary:
      "Educator console for grading SOLO taxonomy stages, distributing quarterly dividends, and exporting to Google Sheets.",
    defaultRoute: "/admin",
    avatarColor: "indigo",
    journeySteps: [
      {
        step: 1,
        label: "5-Pillar Heatmap & Dividends",
        description:
          "Grade SOLO taxonomy stages, credit 1-click dividends & export Google Sheets.",
        href: "/admin",
        badge: "Teacher Console",
      },
      {
        step: 2,
        label: "Audit Class Smart Leaderboard",
        description:
          "Compare student rankings weighted by 1 − HHI diversification & fee discipline.",
        href: "/leaderboard",
        badge: "Class Rankings",
      },
      {
        step: 3,
        label: "Teacher Handbook & Videos",
        description:
          "Zero-prep lesson guides, Episode 4 & 5 video walkthroughs, and rubrics.",
        href: "/handbook",
        badge: "Educator Guide",
      },
    ],
  },
  {
    uid: "user-superadmin-1",
    email: "admin@sgxedu.sg",
    name: "Dr. Tan",
    shortLabel: "Dr. Tan (Superadmin)",
    role: "superadmin",
    roleBadge: "School Superadmin · IT & Governance",
    statHighlight: "Google Sites Embed · School Rules",
    summary:
      "Full school governance: configure Odd-Lot mode, fee structures, Google Sites embed snippets, and audit logs.",
    defaultRoute: "/launch",
    avatarColor: "amber",
    journeySteps: [
      {
        step: 1,
        label: "Generate Google Sites Embed",
        description:
          "Copy 1-click responsive iframe code snippet for school LMS & intranet.",
        href: "/launch",
        badge: "Google Sites Embed",
      },
      {
        step: 2,
        label: "Configure School Rules & Fees",
        description:
          "Set exchange fee modes, odd-lot rules, and school semester schedule.",
        href: "/admin",
        badge: "Governance & Audit",
      },
      {
        step: 3,
        label: "Inspect Video Studio & Handbooks",
        description:
          "Review MOE-aligned curriculum guides, student handbook, and video studio.",
        href: "/handbook",
        badge: "Curriculum Studio",
      },
    ],
  },
];

export const PERSONAL_ACCOUNT_JOURNEY_STEPS: ClassroomJourneyStep[] = [
  {
    step: 1,
    label: "Explore Live Market Screener",
    description:
      "Screen 20 SGX counters, check session hours, and analyze order books.",
    href: "/dashboard",
    badge: "SGX Market",
  },
  {
    step: 2,
    label: "Stage Trade & Consult AI Copilot",
    description:
      "Simulate board-lot orders with low fee drag and Socratic reasoning.",
    href: "/copilot",
    badge: "AI Coaching",
  },
  {
    step: 3,
    label: "Track 5-Pillars & Reflection",
    description:
      "Monitor diversification score, submit reflections, and earn badges.",
    href: "/portfolio",
    badge: "Passport",
  },
];

export function findSampleProfile(
  user?: { uid?: string; email?: string } | null,
): ClassroomSampleProfile | undefined {
  if (!user) return undefined;
  const targetEmail = user.email?.trim().toLowerCase();
  const targetUid = user.uid?.trim();

  return CLASSROOM_SAMPLE_PROFILES.find((p) => {
    if (targetEmail && p.email.toLowerCase() === targetEmail) return true;
    if (
      targetUid &&
      (p.uid === targetUid ||
        targetUid === `gmail-${p.email.replace(/[^a-z0-9]/g, "-")}`)
    ) {
      return true;
    }
    return false;
  });
}

export function getSampleProfileByEmailOrUid(
  emailOrUid?: string | null,
): ClassroomSampleProfile | undefined {
  if (!emailOrUid) return undefined;
  const clean = emailOrUid.trim().toLowerCase();
  return CLASSROOM_SAMPLE_PROFILES.find(
    (p) => p.email.toLowerCase() === clean || p.uid.toLowerCase() === clean,
  );
}
