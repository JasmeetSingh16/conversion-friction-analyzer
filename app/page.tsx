import {
  BarChart3,
  FlaskConical,
  Layers,
  ListOrdered,
  Megaphone,
  MousePointerClick,
  ScanEye,
  ShoppingBag,
  Target,
} from "lucide-react";
import { AgentHero, AgentPage, HowItWorks, RelatedAgents, UseCases } from "../components/agent/AgentTemplate";
import FrictionAnalyzer, { FrictionMap } from "./FrictionAnalyzer";
import { exampleResult } from "./friction-data";

const SLUG = "conversion-friction";

function HeroPreview() {
  return (
    <div className="cf-hero-card" aria-hidden="true">
      <div className="jk-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--jk-line)] px-5 py-4">
          <p className="truncate text-sm font-semibold text-[var(--jk-ink)]">northwind-dental.example/book</p>
          <span className="cf-hero-score">Friction 68</span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1.1fr]">
          <FrictionMap findings={exampleResult.findings} compact />
          <ol className="grid content-start gap-2">
            {exampleResult.findings.slice(0, 3).map((f, i) => (
              <li key={f.issue} className={`cf-hero-issue cf-heat-edge--${f.severity}`}>
                <span className="cf-hero-num">{i + 1}</span>
                <span>{f.issue}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="cf-float">
        <MousePointerClick size={15} aria-hidden="true" />4 buttons → 1
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <AgentPage slug={SLUG}>
      <AgentHero
        slug={SLUG}
        headline={
          <>
            Your page gets traffic. <em>Find out why it doesn&apos;t convert.</em>
          </>
        }
        lede="Point the analyzer at a landing page and tell it what a conversion is. It reads the page, maps where visitors get stuck — headline, buttons, trust, forms — and ranks the fixes by impact."
        chips={[
          { icon: ScanEye, label: "Reads the live page" },
          { icon: Layers, label: "Six friction areas checked" },
          { icon: ListOrdered, label: "Fixes in the order to make them" },
        ]}
        preview={<HeroPreview />}
      />

      <FrictionAnalyzer />

      <HowItWorks
        title={
          <>
            Evidence first, <em>then the fix.</em>
          </>
        }
        text="Every finding quotes what's actually on the page, so you can check it in thirty seconds instead of trusting a vague score."
        steps={[
          {
            icon: Target,
            title: "Set the goal",
            text: "Leads, sales, bookings, sign-ups, demos or enquiries — friction is judged against the action you actually want.",
          },
          {
            icon: ScanEye,
            title: "The page is read like a visitor would",
            text: "Above the fold, value proposition, calls to action, trust signals, offer and forms are each checked, with evidence quoted from the page.",
          },
          {
            icon: ListOrdered,
            title: "Fixes, ranked",
            text: "High-severity, well-evidenced problems come first; quick wins you can ship this week are pulled out separately.",
          },
        ]}
      />

      <UseCases
        title="When to run it"
        items={[
          {
            icon: Megaphone,
            title: "Before you spend more on ads",
            text: "Fix what's leaking on the landing page first, so every extra rupee of ad spend lands on a page that converts.",
            who: "For performance marketers",
          },
          {
            icon: ShoppingBag,
            title: "Product pages that stall",
            text: "Find out whether it's the offer, the trust signals or the checkout step.",
            who: "For ecommerce teams",
          },
          {
            icon: FlaskConical,
            title: "Deciding what to A/B test",
            text: "Turn the ranked findings into a test backlog with a hypothesis for each.",
            who: "For CRO and growth teams",
          },
          {
            icon: BarChart3,
            title: "A full CRO programme",
            text: "We pair the analysis with your analytics and heatmaps, ship the fixes and measure the lift.",
            who: "Built by Jaseir for your stack",
          },
        ]}
      />

      <RelatedAgents slug={SLUG} zone={{ kind: "agent", slug: SLUG }} />
    </AgentPage>
  );
}
