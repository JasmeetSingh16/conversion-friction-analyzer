"use client";

import {
  ArrowRight,
  CalendarCheck,
  CircleCheck,
  Globe,
  Mail,
  MonitorPlay,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  UserPlus,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { EmptyPreview, WorkspaceSection } from "../components/agent/AgentTemplate";
import { CopyButton, CountUp, LoadingSteps } from "../components/agent/AgentUi";
import {
  exampleResult,
  formatNumber,
  getPriority,
  getScoreDescription,
  getScoreLabel,
  goals,
  sampleInputs,
  zoneFor,
  zones,
  type AnalysisResult,
  type Finding,
} from "./friction-data";

const goalIcons: Record<(typeof goals)[number]["icon"], LucideIcon> = {
  lead: UserPlus,
  sale: ShoppingCart,
  booking: CalendarCheck,
  signup: UserRoundPlus,
  demo: MonitorPlay,
  contact: Mail,
};

const LOADING_STEPS = ["Loading your page", "Mapping the page layout", "Finding friction points", "Ranking the fixes"];

export default function FrictionAnalyzer() {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("Lead generation");
  const [visitors, setVisitors] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [bounceRate, setBounceRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [sampleIndex, setSampleIndex] = useState(-1);

  const formRef = useRef<HTMLFormElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  function fillSample() {
    const next = (sampleIndex + 1) % sampleInputs.length;
    const s = sampleInputs[next];
    setSampleIndex(next);
    setUrl(s.url);
    setGoal(s.goal);
    setVisitors(s.visitors);
    setConversionRate(s.conversionRate);
    setBounceRate(s.bounceRate);
    setError("");
  }

  async function analyzeWebsite(event: FormEvent) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Please enter a website URL.");
      urlRef.current?.focus();
      return;
    }

    setLoading(true);
    outputRef.current?.scrollIntoView({ block: "start" });

    try {
      const response = await fetch("/conversion-friction-analyzer/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          goal,
          visitors: visitors.trim() ? Number(visitors) : null,
          conversionRate: conversionRate.trim() ? Number(conversionRate) : null,
          bounceRate: bounceRate.trim() ? Number(bounceRate) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      formRef.current?.scrollIntoView({ block: "start" });
    } finally {
      setLoading(false);
    }
  }

  function resetAnalysis() {
    setResult(null);
    setError("");
    formRef.current?.scrollIntoView({ block: "start" });
  }

  return (
    <WorkspaceSection
      title="Find the friction"
      text="Enter the page you want visitors to convert on and what counts as a conversion. Adding your real numbers sharpens the analysis."
      actions={
        <button type="button" className="jk-btn jk-btn--soft" onClick={fillSample} disabled={loading}>
          <Sparkles size={16} aria-hidden="true" />
          {sampleIndex < 0 ? "Try sample data" : "Try another sample"}
        </button>
      }
    >
      <form ref={formRef} onSubmit={analyzeWebsite} className="jk-card cf-form" noValidate>
        <div className="cf-main">
          <div className="jk-field">
            <label htmlFor="cf-url" className="jk-label">
              Page URL
              <small>Required</small>
            </label>
            <div className="cf-url">
              <Globe size={18} aria-hidden="true" />
              <input
                id="cf-url"
                ref={urlRef}
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://yourwebsite.com/pricing"
                aria-invalid={error && !url.trim() ? true : undefined}
                className="jk-input"
              />
            </div>
          </div>

          <fieldset className="jk-field">
            <legend className="jk-label mb-2">What should visitors do?</legend>
            <div className="cf-goals">
              {goals.map((g) => {
                const Icon = goalIcons[g.icon];
                const on = goal === g.name;
                return (
                  <label key={g.name} className={`cf-goal${on ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name="goal"
                      value={g.name}
                      checked={on}
                      onChange={() => setGoal(g.name)}
                      className="jk-sr"
                    />
                    <Icon size={18} aria-hidden="true" />
                    <span>
                      <span className="cf-goal-name">{g.name}</span>
                      <span className="cf-goal-desc">{g.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="cf-side">
          <div>
            <p className="jk-label">
              Your traffic numbers <small>Optional</small>
            </p>
            <p className="jk-hint mt-1">Monthly figures from your analytics.</p>
          </div>

          <MetricInput id="visitors" label="Monthly visitors" value={visitors} onChange={setVisitors} placeholder="100000" />
          <MetricInput
            id="conversion"
            label="Conversion rate"
            value={conversionRate}
            onChange={setConversionRate}
            placeholder="2.4"
            suffix="%"
            step="0.1"
          />
          <MetricInput id="bounce" label="Bounce rate" value={bounceRate} onChange={setBounceRate} placeholder="52" suffix="%" />

          {error && (
            <div className="jk-error" role="alert">
              <TriangleAlert size={18} aria-hidden="true" className="mt-px shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="jk-btn jk-btn--primary jk-btn--lg jk-btn--block">
            {loading ? "Analysing…" : "Find friction"}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </div>
      </form>

      <p className="jk-sr" role="status">
        {result && !loading ? "Friction report ready." : ""}
      </p>

      <div ref={outputRef} className="cf-output">
        {loading ? (
          <div className="jk-card">
            <LoadingSteps steps={LOADING_STEPS} interval={2200} />
          </div>
        ) : result ? (
          <FrictionReport result={result} onReset={resetAnalysis} />
        ) : (
          <EmptyPreview
            title="Your friction map appears here"
            text="A friction score, a map of where on the page visitors get stuck, and fixes in the order to make them."
          >
            <FrictionReport result={exampleResult} />
          </EmptyPreview>
        )}
      </div>
    </WorkspaceSection>
  );
}

function MetricInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <div className="jk-field">
      <label htmlFor={id} className="jk-label">
        {label}
      </label>
      <div className="cf-metric">
        <input
          id={id}
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="jk-input"
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* REPORT                                                              */
/* ------------------------------------------------------------------ */

const severityRank: Record<string, number> = { high: 3, medium: 2, low: 1 };

/** Page wireframe with each zone tinted by the worst finding in it. */
export function FrictionMap({ findings, compact = false }: { findings: Finding[]; compact?: boolean }) {
  return (
    <div className={`cf-map${compact ? " cf-map--compact" : ""}`}>
      <div className="cf-map-bar" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <ol className="cf-map-zones">
        {zones.map((z) => {
          const inZone = findings.filter((f) => zoneFor(f.category).key === z.key);
          const worst = inZone.reduce((m, f) => Math.max(m, severityRank[f.severity.toLowerCase()] ?? 1), 0);
          const heat = worst === 3 ? "high" : worst === 2 ? "medium" : worst === 1 ? "low" : "none";
          return (
            <li key={z.key} className={`cf-zone cf-zone--${z.key} cf-heat--${heat}`}>
              <span className="cf-zone-label">{z.label}</span>
              {heat !== "none" && <span className="cf-zone-heat">{heat}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FrictionReport({ result, onReset }: { result: AnalysisResult; onReset?: () => void }) {
  const groups = [
    { key: "fix_first", title: "Fix first", note: "High severity, reliable evidence" },
    { key: "fix_next", title: "Fix next", note: "Medium severity" },
    { key: "optimize", title: "Optimise", note: "Smaller or less certain" },
  ] as const;

  const reportText = [
    `Friction report — ${result.website}`,
    `Friction score: ${result.score}/100 (${getScoreLabel(result.score)})`,
    "",
    result.summary,
    "",
    "Quick wins:",
    ...result.quick_wins.map((w) => `- ${w}`),
    "",
    ...result.findings.map((f) => `[${f.severity}] ${f.category}: ${f.issue}\n  Fix: ${f.recommended_fix}`),
  ].join("\n");

  const pct = Math.max(0, Math.min(100, result.score));

  return (
    <article aria-label="Friction report">
      <header className="cf-report-head">
        <div className="min-w-0">
          <p className="jk-eyebrow">Friction report</p>
          <h3 className="cf-report-title break-all">{result.website}</h3>
        </div>
        {onReset && (
          <div className="flex flex-wrap gap-2">
            <CopyButton text={reportText} label="Copy report" />
            <button type="button" className="jk-copy" onClick={onReset}>
              <RotateCcw size={15} aria-hidden="true" />
              Analyse another page
            </button>
          </div>
        )}
      </header>

      {result.fetch_warning && (
        <p className="jk-error mb-4" role="note">
          <TriangleAlert size={18} aria-hidden="true" className="mt-px shrink-0" />
          {result.fetch_warning}
        </p>
      )}

      {/* Score + metrics */}
      <section className="jk-card jk-card-pad" aria-label="Friction score">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="jk-label-sm">Friction score · lower is better</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="cf-score">
                <CountUp value={result.score} />
              </span>
              <span className="text-lg font-semibold text-[var(--jk-ink)]">{getScoreLabel(result.score)}</span>
            </div>
            <div
              className="cf-meter"
              role="meter"
              aria-label="Friction score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={result.score}
            >
              <span className="cf-meter-marker" style={{ left: `${pct}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[var(--jk-muted)]">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
            <p className="mt-5 text-[15.5px] leading-7 text-[var(--jk-body)]">
              {getScoreDescription(result.score)} {result.summary}
            </p>
          </div>

          <dl className="cf-metrics">
            <div>
              <dt>Goal</dt>
              <dd>{result.metrics.primary_goal}</dd>
            </div>
            <div>
              <dt>Monthly visitors</dt>
              <dd>{formatNumber(result.metrics.monthly_visitors)}</dd>
            </div>
            <div>
              <dt>Conversion rate</dt>
              <dd>{result.metrics.conversion_rate !== null ? `${result.metrics.conversion_rate}%` : "—"}</dd>
            </div>
            <div>
              <dt>Bounce rate</dt>
              <dd>{result.metrics.bounce_rate !== null ? `${result.metrics.bounce_rate}%` : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Map + ordered findings */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        <section className="jk-card jk-card-pad lg:self-start" aria-label="Friction map">
          <p className="jk-label-sm">Where visitors get stuck</p>
          <div className="mt-4">
            <FrictionMap findings={result.findings} />
          </div>
          <ul className="cf-legend">
            <li>
              <i className="cf-heat--high" /> High
            </li>
            <li>
              <i className="cf-heat--medium" /> Medium
            </li>
            <li>
              <i className="cf-heat--low" /> Low
            </li>
          </ul>
        </section>

        <div className="grid gap-4">
          {groups.map((g) => {
            const items = result.findings.filter((f) => getPriority(f) === g.key);
            if (!items.length) return null;
            return (
              <section key={g.key} className="jk-card jk-card-pad" aria-label={g.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-lg font-bold tracking-tight text-[var(--jk-ink)]">
                    {g.title} <span className="text-[var(--jk-muted)]">· {items.length}</span>
                  </h4>
                  <p className="jk-hint">{g.note}</p>
                </div>
                <ul className="mt-4 grid gap-3">
                  {items.map((f, i) => (
                    <li key={`${f.category}-${i}`} className={`cf-finding cf-heat-edge--${f.severity.toLowerCase()}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="cf-zone-tag">{zoneFor(f.category).label}</span>
                        <span className={`cf-sev cf-sev--${f.severity.toLowerCase()}`}>{f.severity}</span>
                        <span className="text-xs font-medium text-[var(--jk-muted)]">{f.confidence} confidence</span>
                      </div>
                      <p className="mt-2 font-semibold text-[var(--jk-ink)]">{f.issue}</p>
                      <dl className="cf-finding-body">
                        <div>
                          <dt>Evidence</dt>
                          <dd>{f.evidence}</dd>
                        </div>
                        <div>
                          <dt>Why it matters</dt>
                          <dd>{f.why_it_matters}</dd>
                        </div>
                        <div className="cf-fix">
                          <dt>Fix</dt>
                          <dd>{f.recommended_fix}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {/* Quick wins */}
      {result.quick_wins.length > 0 && (
        <section className="cf-wins" aria-labelledby="cf-wins-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 id="cf-wins-title" className="text-lg font-bold tracking-tight">
              Quick wins you can ship this week
            </h4>
            {onReset && <CopyButton text={result.quick_wins.map((w) => `- ${w}`).join("\n")} label="Copy" />}
          </div>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {result.quick_wins.map((w, i) => (
              <li key={i} className="cf-win">
                <CircleCheck size={18} aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
