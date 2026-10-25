import type { Metadata } from "next";
import HandbookClient from "./HandbookClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Handbooks & Video Walkthroughs · EduFinLit",
  description:
    "Complete Role-Based Field Handbooks and 6-Episode Interactive Video Walkthroughs for Students, Teachers & HODs, and Superadmins.",
};

export default function HandbookPage() {
  return <HandbookClient />;
}
