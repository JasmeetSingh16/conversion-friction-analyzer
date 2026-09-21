"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface Finding {
  category: string;
  severity: "high" | "medium" | "low" | string;
  confidence: "high" | "medium" | "low" | string;
  issue: string;
  evidence: string;
  why_it_matters: string;
  recommended_fix: string;
}

interface AnalysisResult {
  score: number;
  summary: string;
  findings: Finding[];
  quick_wins: string[];
  website: string;
  metrics: {
    monthly_visitors: number | null;
    conversion_rate: number | null;
    bounce_rate: number | null;
    primary_goal: string;
  };
  fetch_warning: string | null;
}

const goals = [
  {
    name: "Lead generation",
    icon: "↗",
    description: "Capture qualified leads",
  },
  {
    name: "Product sale",
    icon: "$",
    description: "Increase purchases",
  },
  {
    name: "Booking / consultation",
    icon: "◷",
    description: "Get more bookings",
  },
  {
    name: "Signup / registration",
    icon: "＋",
    description: "Increase registrations",
  },
  {
    name: "Demo request",
    icon: "▣",
    description: "Generate more demos",
  },
  {
    name: "Contact / inquiry",
    icon: "✉",
    description: "Drive more inquiries",
  },
];

function getSeverityStyle(severity: string) {
  switch (severity.toLowerCase()) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function getConfidenceStyle(confidence: string) {
  switch (confidence.toLowerCase()) {
    case "high":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "medium":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getPriority(
  finding: Finding
): "fix_first" | "fix_next" | "optimize" {
  const severity = finding.severity.toLowerCase();
  const confidence = finding.confidence.toLowerCase();

  if (
    severity === "high" &&
    (confidence === "high" || confidence === "medium")
  ) {
    return "fix_first";
  }

  if (
    severity === "medium" &&
    (confidence === "high" || confidence === "medium")
  ) {
    return "fix_next";
  }

  return "optimize";
}

function getScoreLabel(score: number) {
  if (score <= 30) return "LOW FRICTION";
  if (score <= 60) return "MODERATE FRICTION";
  if (score <= 80) return "HIGH FRICTION";
  return "VERY HIGH FRICTION";
}

function getScoreDescription(score: number) {
  if (score <= 30) {
    return "Your page appears to have relatively low conversion friction.";
  }

  if (score <= 60) {
    return "There are several conversion opportunities worth addressing.";
  }

  if (score <= 80) {
    return "Your page has meaningful friction that may be holding back conversions.";
  }

  return "Your page shows significant friction that should be addressed before optimizing smaller details.";
}

function formatNumber(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("en-US").format(value);
}

function getScoreRing(score: number) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const progress =
    circumference -
    (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return {
    circumference,
    progress,
  };
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("Lead generation");
  const [visitors, setVisitors] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [bounceRate, setBounceRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function analyzeWebsite(event: FormEvent) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Please enter a website URL.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/conversion-friction-analyzer/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          goal,
          visitors: visitors.trim()
            ? Number(visitors)
            : null,
          conversionRate: conversionRate.trim()
            ? Number(conversionRate)
            : null,
          bounceRate: bounceRate.trim()
            ? Number(bounceRate)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Analysis failed."
        );
      }

      setResult(data);

      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setResult(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     REPORT PAGE
  ===================================================== */

  if (result) {
    const fixFirst = result.findings.filter(
      (finding) =>
        getPriority(finding) === "fix_first"
    );

    const fixNext = result.findings.filter(
      (finding) =>
        getPriority(finding) === "fix_next"
    );

    const optimize = result.findings.filter(
      (finding) =>
        getPriority(finding) === "optimize"
    );

    const ring = getScoreRing(result.score);

    return (
      <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        {/* HEADER */}

        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
            <button
              type="button"
              onClick={resetAnalysis}
              className="text-left"
            >
              <div className="text-[18px] font-extrabold tracking-[-0.04em]">
                FRICTION
                <span className="text-slate-400">
                  AI
                </span>
              </div>

              <div className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400">
                CONVERSION INTELLIGENCE
              </div>
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              AI-powered CRO analysis
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          {/* REPORT HEADER */}

          <div className="mb-8">
            <button
              type="button"
              onClick={resetAnalysis}
              className="group mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <span className="transition group-hover:-translate-x-1">
                ←
              </span>

              Analyze another website
            </button>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Analysis complete
                </div>

                <h1 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                  Conversion friction report
                </h1>

                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <span className="max-w-xl truncate">
                    {result.website}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Conversion goal
                </div>

                <div className="mt-1 text-sm font-bold text-slate-800">
                  {result.metrics.primary_goal}
                </div>
              </div>
            </div>
          </div>

          {/* SCORE CARD */}

          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-slate-100/70 blur-3xl" />

            <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[280px_1fr] lg:items-center">
              {/* SCORE RING */}

              <div className="flex flex-col items-center border-b border-slate-100 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                <div className="relative h-48 w-48">
                  <svg
                    viewBox="0 0 180 180"
                    className="h-full w-full -rotate-90"
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-100"
                    />

                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={
                        ring.circumference
                      }
                      strokeDashoffset={
                        ring.progress
                      }
                      className="text-slate-900 transition-all duration-1000"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold tracking-[-0.06em]">
                      {result.score}
                    </span>

                    <span className="mt-1 text-xs font-medium text-slate-400">
                      out of 100
                    </span>
                  </div>
                </div>

                <div className="mt-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[11px] font-extrabold tracking-wider text-slate-700">
                  {getScoreLabel(result.score)}
                </div>
              </div>

              {/* SCORE DETAILS */}

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Friction Score
                </div>

                <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                  {result.score >= 61
                    ? "There are conversion blockers worth fixing."
                    : "Your conversion experience is in good shape."}
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  {getScoreDescription(
                    result.score
                  )}
                </p>

                <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-lg sm:gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Low
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      0–30
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Moderate
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      31–60
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      High
                    </div>

                    <div className="mt-1 text-sm font-bold">
                      61–100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AI DIAGNOSIS */}

          <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-[#111827] text-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <div className="p-6 sm:p-9">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm">
                  ✦
                </span>

                AI Diagnosis
              </div>

              <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                What is holding your
                <br className="hidden sm:block" />
                conversions back?
              </h2>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300">
                {result.summary}
              </p>
            </div>

            <div className="grid border-t border-white/10 sm:grid-cols-4">
              <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Goal
                </div>

                <div className="mt-2 text-sm font-semibold">
                  {result.metrics.primary_goal}
                </div>
              </div>

              <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Visitors
                </div>

                <div className="mt-2 text-lg font-bold">
                  {formatNumber(
                    result.metrics.monthly_visitors
                  )}
                </div>
              </div>

              <div className="border-b border-white/10 p-5 sm:border-b-0 sm:border-r">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Conversion
                </div>

                <div className="mt-2 text-lg font-bold">
                  {result.metrics.conversion_rate !==
                  null
                    ? `${result.metrics.conversion_rate}%`
                    : "—"}
                </div>
              </div>

              <div className="p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Bounce rate
                </div>

                <div className="mt-2 text-lg font-bold">
                  {result.metrics.bounce_rate !==
                  null
                    ? `${result.metrics.bounce_rate}%`
                    : "—"}
                </div>
              </div>
            </div>
          </section>

          {/* ACTION PLAN */}

          <section className="mt-14">
            <div className="mb-7">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Action Plan
              </div>

              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                What should you fix first?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Prioritized around your selected conversion goal.
              </p>
            </div>

            <div className="space-y-4">
              {/* FIX FIRST */}

              <div className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-red-100 bg-red-50/50 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-sm font-extrabold text-red-700">
                      01
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        Fix First
                      </h3>

                      <p className="text-xs text-slate-500">
                        Highest impact
                      </p>
                    </div>
                  </div>

                  <span className="hidden rounded-full bg-red-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 sm:block">
                    Priority
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {fixFirst.length > 0 ? (
                    fixFirst.map(
                      (finding, index) => (
                        <div
                          key={`${finding.category}-${index}`}
                          className="px-5 py-5 sm:px-6"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold">
                              {finding.category}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${getSeverityStyle(
                                finding.severity
                              )}`}
                            >
                              {finding.severity}
                            </span>
                          </div>

                          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                            {finding.recommended_fix}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No high-priority issues detected.
                    </div>
                  )}
                </div>
              </div>

              {/* FIX NEXT */}

              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-amber-100 bg-amber-50/50 px-5 py-4 sm:px-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-sm font-extrabold text-amber-700">
                    02
                  </div>

                  <div>
                    <h3 className="font-extrabold">
                      Fix Next
                    </h3>

                    <p className="text-xs text-slate-500">
                      Important improvements
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {fixNext.length > 0 ? (
                    fixNext.map(
                      (finding, index) => (
                        <div
                          key={`${finding.category}-${index}`}
                          className="px-5 py-5 sm:px-6"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold">
                              {finding.category}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${getSeverityStyle(
                                finding.severity
                              )}`}
                            >
                              {finding.severity}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {finding.recommended_fix}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No medium-priority improvements detected.
                    </div>
                  )}
                </div>
              </div>

              {/* OPTIMIZE */}

              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/50 px-5 py-4 sm:px-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-extrabold text-emerald-700">
                    03
                  </div>

                  <div>
                    <h3 className="font-extrabold">
                      Optimize
                    </h3>

                    <p className="text-xs text-slate-500">
                      Lower-priority opportunities
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {optimize.length > 0 ? (
                    optimize.map(
                      (finding, index) => (
                        <div
                          key={`${finding.category}-${index}`}
                          className="px-5 py-5 sm:px-6"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold">
                              {finding.category}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${getSeverityStyle(
                                finding.severity
                              )}`}
                            >
                              {finding.severity}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {finding.recommended_fix}
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No lower-priority opportunities detected.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* DETAILED ANALYSIS */}

          <section className="mt-14">
            <div className="mb-7">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Detailed Analysis
              </div>

              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">
                Top friction points
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {result.findings.map(
                (finding, index) => (
                  <article
                    key={`${finding.category}-${index}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-500">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <h3 className="text-base font-extrabold">
                          {finding.category}
                        </h3>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase ${getSeverityStyle(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>
                    </div>

                    <div className="mt-6">
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${getConfidenceStyle(
                          finding.confidence
                        )}`}
                      >
                        {finding.confidence} confidence
                      </span>

                      <h4 className="mt-4 text-sm font-bold leading-6 text-slate-900">
                        {finding.issue}
                      </h4>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Evidence
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {finding.evidence}
                        </p>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Why it matters
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600">
                          {finding.why_it_matters}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recommended fix
                      </div>

                      <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-800">
                        {finding.recommended_fix}
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>

          {/* QUICK WINS */}

          <section className="mt-14">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg text-white">
                    ⚡
                  </div>

                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Start here
                    </div>

                    <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                      Quick wins
                    </h2>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  High-impact changes you can act on immediately.
                </p>
              </div>

              <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
                {result.quick_wins.map(
                  (win, index) => (
                    <div
                      key={index}
                      className="p-6 sm:p-7"
                    >
                      <div className="text-xs font-extrabold text-slate-300">
                        0{index + 1}
                      </div>

                      <p className="mt-4 text-sm font-semibold leading-6 text-slate-800">
                        {win}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="mt-10 border-t border-slate-200 pt-7 pb-8 text-center">
            <p className="mx-auto max-w-2xl text-[11px] leading-5 text-slate-400">
              The Conversion Friction Score is an AI-generated heuristic
              intended to prioritize potential conversion issues. It is not
              a scientifically validated prediction of conversion performance.
            </p>

            <div className="mt-4 text-xs font-bold tracking-tight text-slate-300">
              FRICTIONAI
            </div>
          </footer>
        </div>
      </main>
    );
  }

  /* =====================================================
     LANDING PAGE
  ===================================================== */

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] text-[#0f172a]">
      {/* HEADER */}

      <header className="relative z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div>
            <div className="text-[18px] font-extrabold tracking-[-0.04em]">
              FRICTION
              <span className="text-slate-400">
                AI
              </span>
            </div>

            <div className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400">
              CONVERSION INTELLIGENCE
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI-powered CRO analysis
          </div>
        </div>
      </header>

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute inset-x-0 top-[76px] h-[650px] overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[650px] w-[950px] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* HERO */}

      <section className="relative px-5 pb-12 pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
              ✦
            </span>

            Conversion Intelligence
          </div>

          <h1 className="text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl lg:text-[68px] lg:leading-[1.02]">
            Your website gets traffic.
            <br />

            <span className="text-slate-400">
              Why isn't it converting?
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Analyze your page, combine it with your actual traffic metrics,
            and discover the conversion friction you should fix first.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-2">
              <span className="text-emerald-500">
                ✓
              </span>
              AI-powered analysis
            </span>

            <span className="flex items-center gap-2">
              <span className="text-emerald-500">
                ✓
              </span>
              Evidence-based insights
            </span>

            <span className="flex items-center gap-2">
              <span className="text-emerald-500">
                ✓
              </span>
              Prioritized actions
            </span>
          </div>
        </div>
      </section>

      {/* FORM */}

      <section className="relative px-5 pb-24">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={analyzeWebsite}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
          >
            <div className="p-6 sm:p-9">
              {/* URL */}

              <div>
                <label className="text-sm font-extrabold text-slate-900">
                  Website URL
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative mt-2.5">
                  <div className="pointer-events-none absolute left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                    ↗
                  </div>

                  <input
                    type="url"
                    value={url}
                    onChange={(event) =>
                      setUrl(
                        event.target.value
                      )
                    }
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Enter the public URL of the page you want to analyze.
                </p>
              </div>

              {/* GOAL */}

              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="mb-4">
                  <label className="text-sm font-extrabold text-slate-900">
                    Primary conversion goal
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    What action matters most on this page?
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {goals.map((item) => {
                    const selected =
                      goal === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() =>
                          setGoal(
                            item.name
                          )
                        }
                        className={`group flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            selected
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.icon}
                        </span>

                        <span className="min-w-0">
                          <span className="block text-sm font-bold">
                            {item.name}
                          </span>

                          <span
                            className={`mt-0.5 block text-[11px] ${
                              selected
                                ? "text-slate-300"
                                : "text-slate-400"
                            }`}
                          >
                            {item.description}
                          </span>
                        </span>

                        {selected && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* METRICS */}

              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold">
                      Your traffic metrics
                    </h2>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Optional
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Adding your real metrics helps contextualize the analysis.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {/* VISITORS */}

                  <label className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition focus-within:border-slate-400 focus-within:bg-white">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Monthly visitors
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={visitors}
                      onChange={(event) =>
                        setVisitors(
                          event.target.value
                        )
                      }
                      placeholder="100000"
                      className="mt-2 w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                    />
                  </label>

                  {/* CONVERSION */}

                  <label className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition focus-within:border-slate-400 focus-within:bg-white">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Conversion rate
                    </span>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={conversionRate}
                        onChange={(event) =>
                          setConversionRate(
                            event.target.value
                          )
                        }
                        placeholder="2.4"
                        className="mt-2 w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                      />

                      <span className="mt-2 text-sm font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </label>

                  {/* BOUNCE */}

                  <label className="rounded-xl border border-slate-200 bg-slate-50 p-3 transition focus-within:border-slate-400 focus-within:bg-white">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bounce rate
                    </span>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={bounceRate}
                        onChange={(event) =>
                          setBounceRate(
                            event.target.value
                          )
                        }
                        placeholder="52"
                        className="mt-2 w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                      />

                      <span className="mt-2 text-sm font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-xs font-bold text-red-600">
                      !
                    </div>

                    <div>
                      <div className="text-sm font-bold text-red-800">
                        Analysis failed
                      </div>

                      <div className="mt-1 text-xs leading-5 text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYZE BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-5 py-4 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_12px_28px_rgba(15,23,42,0.2)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Analyzing your website...
                  </>
                ) : (
                  <>
                    Analyze Conversion Friction

                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
                <span>🔒</span>

                No account required · Analysis based on public page content
              </div>
            </div>
          </form>

          {/* BOTTOM FEATURES */}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[11px] font-medium text-slate-400">
            <span>
              Website structure analysis
            </span>

            <span className="hidden sm:block">
              •
            </span>

            <span>
              Conversion psychology
            </span>

            <span className="hidden sm:block">
              •
            </span>

            <span>
              Prioritized CRO recommendations
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}