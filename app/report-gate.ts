/* ------------------------------------------------------------------ */
/* What the free preview shows before the "Get your full report" form. */
/* Used by the API route (to build the preview it sends) and the page  */
/* (when the report isn't sealed and is only blurred).                 */
/* ------------------------------------------------------------------ */

import { getPriority, getScoreLabel, type AnalysisResult, type Finding } from "./friction-data";

/** Findings shown in full in the preview. */
export const PREVIEW_FINDINGS = 3;

const order = { fix_first: 0, fix_next: 1, optimize: 2 } as const;

/** Findings in the order the report shows them: fix first, fix next, optimise. */
export function rankFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => order[getPriority(a)] - order[getPriority(b)]);
}

/** Score, summary and metrics, plus the three most important findings. */
export function previewOf(result: AnalysisResult): AnalysisResult {
  return { ...result, findings: rankFindings(result.findings).slice(0, PREVIEW_FINDINGS), quick_wins: [] };
}

/** The findings and quick wins the preview leaves out. */
export function lockedOf(result: AnalysisResult): Pick<AnalysisResult, "findings" | "quick_wins"> {
  return { findings: rankFindings(result.findings).slice(PREVIEW_FINDINGS), quick_wins: result.quick_wins };
}

export function inputOf({ url, goal }: { url: string; goal: string }): string {
  return `${url} (goal: ${goal})`;
}

export function summaryOf(result: AnalysisResult): string {
  return `Friction score ${result.score}/100 (${getScoreLabel(result.score)}) · ${result.findings.length} findings, ${result.quick_wins.length} quick wins`;
}
