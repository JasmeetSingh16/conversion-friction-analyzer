/* ------------------------------------------------------------------ */
/* What the free preview shows before the "Get your full report" form. */
/* Used by the API route (to build the preview it sends) and the page  */
/* (when the report isn't sealed and is only blurred).                 */
/* ------------------------------------------------------------------ */

import { getScoreLabel, type AnalysisResult } from "./friction-data";

/** Only the page and goal the visitor entered — the whole report is locked. */
export function previewOf(result: AnalysisResult): AnalysisResult {
  return { ...result, score: 0, summary: "", findings: [], quick_wins: [] };
}

export function inputOf({ url, goal }: { url: string; goal: string }): string {
  return `${url} (goal: ${goal})`;
}

export function summaryOf(result: AnalysisResult): string {
  return `Friction score ${result.score}/100 (${getScoreLabel(result.score)}) · ${result.findings.length} findings, ${result.quick_wins.length} quick wins`;
}
