import type { Metadata } from "next";
import { Suspense } from "react";

import { ToolHero } from "@/components/ToolHero";
import { Topbar } from "@/components/Topbar";
import { TOOLS } from "@/lib/tools";
import ToolsLoading from "../loading";
import { PlaywrightForm } from "./PlaywrightForm";

const TOOL = TOOLS["playwright"];

export const metadata: Metadata = {
  title: TOOL.name,
  description: TOOL.longDescription,
  alternates: { canonical: `/tools/${TOOL.slug}` },
  openGraph: {
    title: `${TOOL.name} · QA Copilot`,
    description: TOOL.longDescription,
    url: `/tools/${TOOL.slug}`,
  },
  twitter: {
    title: `${TOOL.name} · QA Copilot`,
    description: TOOL.longDescription,
  },
};

export default function PlaywrightPage() {
  return (
    <>
      <Topbar title={TOOL.name} subtitle={TOOL.tagline} />
      <main className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
        <ToolHero tool={TOOL} />
        <Suspense fallback={<ToolsLoading />}>
          <PlaywrightForm />
        </Suspense>
      </main>
    </>
  );
}
