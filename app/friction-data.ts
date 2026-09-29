/* ------------------------------------------------------------------ */
/* Types, goals, samples, the page zones used by the friction map,     */
/* and the example report for the hero and empty state.                */
/* ------------------------------------------------------------------ */

export interface Finding {
  category: string;
  severity: "high" | "medium" | "low" | string;
  confidence: "high" | "medium" | "low" | string;
  issue: string;
  evidence: string;
  why_it_matters: string;
  recommended_fix: string;
}

export interface AnalysisResult {
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

export const goals = [
  { name: "Lead generation", icon: "lead", description: "Capture qualified leads" },
  { name: "Product sale", icon: "sale", description: "Increase purchases" },
  { name: "Booking / consultation", icon: "booking", description: "Get more bookings" },
  { name: "Signup / registration", icon: "signup", description: "Increase registrations" },
  { name: "Demo request", icon: "demo", description: "Generate more demos" },
  { name: "Contact / inquiry", icon: "contact", description: "Drive more inquiries" },
] as const;

export const sampleInputs = [
  { url: "https://www.jaseir.com/contact/", goal: "Lead generation", visitors: "12000", conversionRate: "1.4", bounceRate: "58" },
  { url: "https://cal.com", goal: "Signup / registration", visitors: "400000", conversionRate: "3.1", bounceRate: "44" },
  { url: "https://www.allbirds.com", goal: "Product sale", visitors: "900000", conversionRate: "2.2", bounceRate: "39" },
];

/**
 * Page zones for the friction map, top to bottom. Each of the six
 * categories the API returns lands in one zone of the page wireframe.
 */
export const zones = [
  { key: "above", label: "Above the fold", match: "above" },
  { key: "value", label: "Value proposition", match: "value" },
  { key: "cta", label: "Calls to action", match: "cta" },
  { key: "trust", label: "Trust & social proof", match: "trust" },
  { key: "offer", label: "Offer & urgency", match: "offer" },
  { key: "funnel", label: "Forms & funnel", match: "funnel" },
] as const;

export function zoneFor(category: string) {
  const c = category.toLowerCase();
  return zones.find((z) => c.includes(z.match)) ?? zones[zones.length - 1];
}

export function getPriority(finding: Finding): "fix_first" | "fix_next" | "optimize" {
  const severity = finding.severity.toLowerCase();
  const confidence = finding.confidence.toLowerCase();

  if (severity === "high" && (confidence === "high" || confidence === "medium")) {
    return "fix_first";
  }

  if (severity === "medium" && (confidence === "high" || confidence === "medium")) {
    return "fix_next";
  }

  return "optimize";
}

export function getScoreLabel(score: number) {
  if (score <= 30) return "Low friction";
  if (score <= 60) return "Moderate friction";
  if (score <= 80) return "High friction";
  return "Very high friction";
}

export function getScoreDescription(score: number) {
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

export function formatNumber(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("en-US").format(value);
}

export const exampleResult: AnalysisResult = {
  score: 68,
  summary:
    "Visitors reach a clear headline, but the page asks them to choose between four buttons, hides reviews below the fold and ends in an eight-field form.",
  website: "https://www.northwind-dental.example/book",
  metrics: { monthly_visitors: 18000, conversion_rate: 1.6, bounce_rate: 61, primary_goal: "Booking / consultation" },
  fetch_warning: null,
  quick_wins: [
    "Keep one primary button — 'Book an appointment' — and demote the rest to text links.",
    "Move the 4.8★ review count next to the headline.",
    "Cut the booking form from eight fields to four.",
  ],
  findings: [
    {
      category: "CTA Clarity",
      severity: "high",
      confidence: "high",
      issue: "Four competing buttons in the hero",
      evidence: "'Book now', 'Call us', 'View services' and 'Offers' share equal weight.",
      why_it_matters: "Choice overload delays the first click.",
      recommended_fix: "One primary 'Book an appointment' button; others as links.",
    },
    {
      category: "Page/Funnel Friction",
      severity: "high",
      confidence: "medium",
      issue: "Eight required fields in the booking form",
      evidence: "Includes address and date of birth before choosing a slot.",
      why_it_matters: "Every extra field lowers completion.",
      recommended_fix: "Ask for name, phone, treatment and slot only.",
    },
    {
      category: "Trust & Social Proof",
      severity: "medium",
      confidence: "high",
      issue: "Reviews hidden below the fold",
      evidence: "The 4.8★ rating appears only in the footer.",
      why_it_matters: "Trust signals matter most before the first click.",
      recommended_fix: "Show the rating beside the headline.",
    },
    {
      category: "Above-the-Fold Experience",
      severity: "medium",
      confidence: "medium",
      issue: "Hero image pushes the button down on phones",
      evidence: "The button sits 1.4 screens down at 375 px.",
      why_it_matters: "Most visitors are on mobile.",
      recommended_fix: "Shorter hero image on mobile.",
    },
    {
      category: "Value Proposition",
      severity: "low",
      confidence: "high",
      issue: "Headline is clear but generic",
      evidence: "'Quality dental care for your family'.",
      why_it_matters: "Doesn't say why this clinic over others.",
      recommended_fix: "Lead with same-week appointments.",
    },
    {
      category: "Offer & Urgency",
      severity: "low",
      confidence: "medium",
      issue: "New-patient offer is easy to miss",
      evidence: "Only mentioned on the Offers page.",
      why_it_matters: "A reason to act now lifts bookings.",
      recommended_fix: "Add the offer to the hero.",
    },
  ],
};
