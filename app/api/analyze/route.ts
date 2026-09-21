import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =====================================================
   TYPES
===================================================== */

type Level = "high" | "medium" | "low";

interface Finding {
  category: string;
  severity: Level;
  confidence: Level;
  issue: string;
  evidence: string;
  why_it_matters: string;
  recommended_fix: string;
}

/* =====================================================
   TEXT CLEANING
===================================================== */

function cleanText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* =====================================================
   GENERIC EXTRACTION
===================================================== */

function extractMatches(
  html: string,
  regex: RegExp,
  limit = 100
): string[] {
  const results: string[] = [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (results.length >= limit) {
      break;
    }

    const value = cleanText(
      match[1] || match[0]
    );

    if (value) {
      results.push(value);
    }
  }

  return results;
}

/* =====================================================
   TITLE
===================================================== */

function extractTitle(
  html: string
): string {
  const match = html.match(
    /<title\b[^>]*>([\s\S]*?)<\/title>/i
  );

  return match
    ? cleanText(match[1])
    : "";
}

/* =====================================================
   HEADINGS
===================================================== */

function extractHeadings(
  html: string
): string[] {
  return extractMatches(
    html,
    /<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi,
    40
  );
}

/* =====================================================
   BUTTONS
===================================================== */

function extractButtons(
  html: string
): string[] {
  return extractMatches(
    html,
    /<button\b[^>]*>([\s\S]*?)<\/button>/gi,
    60
  );
}

/* =====================================================
   LINKS
===================================================== */

function extractLinkDetails(
  html: string
): string[] {
  const results: string[] = [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (results.length >= 80) {
      break;
    }

    const href = match[1];
    const text = cleanText(match[2]);

    if (!text) {
      continue;
    }

    if (text.length > 150) {
      continue;
    }

    results.push(
      `${text} → ${href}`
    );
  }

  return [
    ...new Set(results),
  ];
}

/* =====================================================
   INPUTS
===================================================== */

function extractInputs(
  html: string
): string[] {
  const results: string[] = [];

  const regex =
    /<input\b([^>]*)>/gi;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    if (results.length >= 50) {
      break;
    }

    const attrs = match[1];

    const type =
      attrs.match(
        /type=["']([^"']+)["']/i
      )?.[1] || "text";

    const name =
      attrs.match(
        /name=["']([^"']+)["']/i
      )?.[1] || "";

    const placeholder =
      attrs.match(
        /placeholder=["']([^"']+)["']/i
      )?.[1] || "";

    const ariaLabel =
      attrs.match(
        /aria-label=["']([^"']+)["']/i
      )?.[1] || "";

    results.push(
      [
        `type=${type}`,
        name
          ? `name=${name}`
          : "",
        placeholder
          ? `placeholder=${placeholder}`
          : "",
        ariaLabel
          ? `aria-label=${ariaLabel}`
          : "",
      ]
        .filter(Boolean)
        .join(", ")
    );
  }

  return results;
}

/* =====================================================
   FORMS
===================================================== */

function extractForms(
  html: string
): number {
  const matches = html.match(
    /<form\b[\s\S]*?<\/form>/gi
  );

  return matches
    ? matches.length
    : 0;
}

/* =====================================================
   CTA DETECTION
===================================================== */

function extractCtaCandidates(
  links: string[],
  buttons: string[]
): string[] {
  const combined = [
    ...links,
    ...buttons,
  ];

  const ctaKeywords = [
    "sign up",
    "signup",
    "get started",
    "start",
    "try",
    "free",
    "trial",
    "book",
    "demo",
    "contact",
    "buy",
    "purchase",
    "subscribe",
    "join",
    "create",
    "register",
    "download",
    "learn more",
    "get",
    "request",
  ];

  const results =
    combined.filter(
      (item) => {
        const lower =
          item.toLowerCase();

        return ctaKeywords.some(
          (keyword) =>
            lower.includes(keyword)
        );
      }
    );

  return [
    ...new Set(results),
  ].slice(0, 30);
}

/* =====================================================
   URL VALIDATION
===================================================== */

function isPrivateIPv4(
  hostname: string
): boolean {
  const parts =
    hostname
      .split(".")
      .map(Number);

  if (
    parts.length !== 4 ||
    parts.some((part) =>
      Number.isNaN(part)
    )
  ) {
    return false;
  }

  const [a, b] = parts;

  if (a === 10) {
    return true;
  }

  if (
    a === 172 &&
    b >= 16 &&
    b <= 31
  ) {
    return true;
  }

  if (
    a === 192 &&
    b === 168
  ) {
    return true;
  }

  if (a === 127) {
    return true;
  }

  return false;
}

function isValidUrl(
  value: string
): boolean {
  try {
    const url = new URL(value);

    if (
      !["http:", "https:"].includes(
        url.protocol
      )
    ) {
      return false;
    }

    const hostname =
      url.hostname.toLowerCase();

    if (
      hostname ===
        "localhost" ||
      hostname ===
        "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    ) {
      return false;
    }

    if (
      isPrivateIPv4(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/* =====================================================
   WEBSITE FETCH
===================================================== */

async function fetchWebsite(
  url: string
) {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => {
      controller.abort();
    },
    8000
  );

  try {
    const response =
      await fetch(url, {
        signal:
          controller.signal,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; FrictionAI/1.0)",

          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },

        redirect: "follow",
      });

    if (!response.ok) {
      throw new Error(
        `Website returned HTTP ${response.status}`
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.includes(
        "text/html"
      )
    ) {
      throw new Error(
        "The provided URL does not appear to be an HTML webpage."
      );
    }

    const html =
      await response.text();

    const title =
      extractTitle(html);

    const headings =
      extractHeadings(html);

    const links =
      extractLinkDetails(html);

    const buttons =
      extractButtons(html);

    const inputs =
      extractInputs(html);

    const formsCount =
      extractForms(html);

    const ctaCandidates =
      extractCtaCandidates(
        links,
        buttons
      );

    /*
     * Keep the page text relatively small
     * so the model has enough output budget.
     */
    const pageText =
      cleanText(html).slice(
        0,
        7000
      );

    return {
      title,

      headings:
        headings.slice(
          0,
          40
        ),

      links:
        links.slice(
          0,
          80
        ),

      buttons:
        buttons.slice(
          0,
          60
        ),

      cta_candidates:
        ctaCandidates.slice(
          0,
          30
        ),

      inputs:
        inputs.slice(
          0,
          50
        ),

      forms_count:
        formsCount,

      page_text:
        pageText,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* =====================================================
   NORMALIZE AI LEVEL
===================================================== */

function normalizeLevel(
  value: unknown
): Level {
  /*
   * The model sometimes returns numbers such as:
   * 20, 50, 80
   *
   * Convert them safely.
   */
  if (
    typeof value ===
    "number"
  ) {
    if (value >= 70) {
      return "high";
    }

    if (value >= 40) {
      return "medium";
    }

    return "low";
  }

  const normalized =
    String(value)
      .toLowerCase()
      .trim();

  if (
    normalized === "high" ||
    normalized ===
      "high confidence" ||
    normalized ===
      "high severity"
  ) {
    return "high";
  }

  if (
    normalized ===
      "medium" ||
    normalized ===
      "moderate" ||
    normalized ===
      "medium confidence" ||
    normalized ===
      "medium severity" ||
    normalized ===
      "moderate confidence" ||
    normalized ===
      "moderate severity"
  ) {
    return "medium";
  }

  return "low";
}

/* =====================================================
   NORMALIZE FINDINGS
===================================================== */

function normalizeFindings(
  findings: any[]
): Finding[] {
  return findings.map(
    (finding) => ({
      category:
        String(
          finding.category ||
            "Unknown"
        ),

      severity:
        normalizeLevel(
          finding.severity
        ),

      confidence:
        normalizeLevel(
          finding.confidence
        ),

      issue:
        String(
          finding.issue || ""
        ),

      evidence:
        String(
          finding.evidence || ""
        ),

      why_it_matters:
        String(
          finding.why_it_matters ||
            ""
        ),

      recommended_fix:
        String(
          finding.recommended_fix ||
            ""
        ),
    })
  );
}

/* =====================================================
   FALLBACK QUICK WINS
===================================================== */

function generateFallbackQuickWins(
  findings: Finding[],
  goal: string
): string[] {
  const severityScore: Record<
    Level,
    number
  > = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const sorted =
    [...findings].sort(
      (a, b) => {
        const aScore =
          severityScore[
            a.severity
          ];

        const bScore =
          severityScore[
            b.severity
          ];

        return (
          bScore - aScore
        );
      }
    );

  const fixes =
    sorted
      .map(
        (finding) =>
          finding.recommended_fix
      )
      .filter(
        (fix) =>
          fix.trim().length > 0
      )
      .slice(0, 3);

  const fallback =
    `Make the primary ${goal.toLowerCase()} action clear and easy to complete.`;

  while (
    fixes.length < 3
  ) {
    fixes.push(fallback);
  }

  return fixes.slice(
    0,
    3
  );
}

/* =====================================================
   POST /api/analyze
===================================================== */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      url,
      visitors,
      conversionRate,
      bounceRate,
      goal,
    } = body;

    /* -------------------------------------------------
       URL VALIDATION
    ------------------------------------------------- */

    if (
      !url ||
      typeof url !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Website URL is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidUrl(url)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid public HTTP/HTTPS URL.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------
       API KEY
    ------------------------------------------------- */

    if (
      !process.env.GROQ_API_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /* -------------------------------------------------
       FETCH WEBSITE
    ------------------------------------------------- */

    let website;

    try {
      website =
        await fetchWebsite(url);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof
            Error
              ? error.message
              : "Unable to fetch the website.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------
       EXACT USER GOAL
    ------------------------------------------------- */

    /*
     * IMPORTANT:
     * Never overwrite the user's selected goal.
     */

    const primaryGoal =
      typeof goal ===
        "string" &&
      goal.trim()
        ? goal.trim()
        : "Lead generation";

    /* -------------------------------------------------
       METRICS
    ------------------------------------------------- */

    const metrics = {
      monthly_visitors:
        typeof visitors ===
        "number"
          ? visitors
          : null,

      conversion_rate:
        typeof conversionRate ===
        "number"
          ? conversionRate
          : null,

      bounce_rate:
        typeof bounceRate ===
        "number"
          ? bounceRate
          : null,

      primary_goal:
        primaryGoal,
    };

    /* -------------------------------------------------
       AI PROMPT
    ------------------------------------------------- */

    const analysisPrompt = `
You are a senior Conversion Rate Optimization strategist.

Analyze this webpage ONLY for conversion friction.

Do NOT perform a generic website audit.

==================================================
USER'S EXACT CONVERSION GOAL
==================================================

${primaryGoal}

IMPORTANT:

The user's conversion goal is EXACTLY:

"${primaryGoal}"

You MUST preserve this goal.

Do NOT call it lead generation if the user selected signup.

Do NOT call it signup if the user selected product sale.

Use the exact goal when explaining why an issue matters.

==================================================
WEBSITE
==================================================

URL:
${url}

PAGE TITLE:
${website.title || "Not detected"}

HEADINGS:
${
  website.headings.join(
    "\n"
  ) || "None detected"
}

CTA CANDIDATES:
${
  website.cta_candidates.join(
    "\n"
  ) || "None detected"
}

BUTTONS:
${
  website.buttons.join(
    "\n"
  ) || "None detected"
}

LINKS:
${
  website.links.join(
    "\n"
  ) || "None detected"
}

INPUTS:
${
  website.inputs.join(
    "\n"
  ) || "None detected"
}

FORMS:
${website.forms_count}

PAGE TEXT:
${website.page_text}

==================================================
TRAFFIC CONTEXT
==================================================

Monthly visitors:
${
  metrics.monthly_visitors ??
  "Not provided"
}

Conversion rate:
${
  metrics.conversion_rate ??
  "Not provided"
}%

Bounce rate:
${
  metrics.bounce_rate ??
  "Not provided"
}%

==================================================
ANALYSIS RULES
==================================================

1. Focus specifically on conversion friction.

2. Use only evidence supplied above.

3. Never invent website facts.

4. "Not detected" does not mean "does not exist."

5. Metrics are contextual and do not prove causation.

6. The selected conversion goal must drive the analysis.

7. Do not force every category to be a problem.

8. If evidence is weak, use low severity and low confidence.

9. Keep findings concise.

10. Recommendations must be practical and evidence-based.

==================================================
URGENCY / OFFER RULE
==================================================

The absence of urgency is NOT automatically a conversion problem.

Do NOT recommend:

- fake scarcity
- countdown timers
- artificial deadlines
- invented discounts
- invented promotions
- invented free trials
- invented trial durations
- misleading scarcity

NEVER assume that a free trial exists.

NEVER invent a trial duration such as 7, 14, or 30 days.

If the website does not provide evidence of a legitimate offer or urgency mechanism, then:

severity = "low"

The recommended fix should say:

"No significant urgency friction detected from the available evidence."

Do NOT tell the user to create urgency just because no urgency was detected.

==================================================
SIX CATEGORIES
==================================================

Return exactly these six categories:

1. Value Proposition
2. CTA Clarity
3. Trust & Social Proof
4. Page/Funnel Friction
5. Offer & Urgency
6. Above-the-Fold Experience

You MUST return exactly SIX findings.

One finding per category.

==================================================
SEVERITY FORMAT
==================================================

The severity field MUST be a STRING.

Allowed values:

"high"
"medium"
"low"

NEVER return a number.

NEVER return:

"Moderate"

NEVER return:

"High severity"

Correct example:

"severity": "medium"

==================================================
CONFIDENCE FORMAT
==================================================

The confidence field MUST be a STRING.

Allowed values:

"high"
"medium"
"low"

NEVER return a number.

NEVER return:

"Moderate"

Correct example:

"confidence": "high"

==================================================
SCORING
==================================================

Return a heuristic score from 0 to 100.

0-30 = Low friction
31-60 = Moderate friction
61-80 = High friction
81-100 = Very high friction

The score is heuristic and is not scientifically validated.

==================================================
QUICK WINS
==================================================

After all SIX findings, return EXACTLY THREE quick wins.

Quick wins must be based on the highest-impact findings.

Do not invent offers.

Do not invent promotions.

Do not recommend artificial urgency.

==================================================
FINAL RESPONSE REQUIREMENTS
==================================================

The response MUST contain exactly these four top-level properties:

score
summary
findings
quick_wins

findings MUST contain exactly 6 objects.

quick_wins MUST contain exactly 3 strings.

Do NOT stop after the findings.

Return ONLY valid JSON.
`;

    /* -------------------------------------------------
       GROQ REQUEST
    ------------------------------------------------- */

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "openai/gpt-oss-20b",

          temperature: 0,

          max_completion_tokens:
            5000,

          messages: [
            {
              role: "system",
              content:
                "You are an evidence-driven CRO analyst. Follow the requested JSON structure exactly. Preserve the user's exact conversion goal. Severity and confidence must be strings.",
            },

            {
              role: "user",
              content:
                analysisPrompt,
            },
          ],

          response_format: {
            type: "json_schema",

            json_schema: {
              name:
                "conversion_analysis",

              strict: true,

              schema: {
                type: "object",

                properties: {
                  score: {
                    type: "integer",
                  },

                  summary: {
                    type: "string",
                  },

                  findings: {
                    type: "array",

                    items: {
                      type: "object",

                      properties: {
                        category: {
                          type: "string",
                        },

                        severity: {
                          type: "string",
                        },

                        confidence: {
                          type: "string",
                        },

                        issue: {
                          type: "string",
                        },

                        evidence: {
                          type: "string",
                        },

                        why_it_matters: {
                          type: "string",
                        },

                        recommended_fix: {
                          type: "string",
                        },
                      },

                      required: [
                        "category",
                        "severity",
                        "confidence",
                        "issue",
                        "evidence",
                        "why_it_matters",
                        "recommended_fix",
                      ],

                      additionalProperties:
                        false,
                    },
                  },

                  quick_wins: {
                    type: "array",

                    items: {
                      type: "string",
                    },
                  },
                },

                required: [
                  "score",
                  "summary",
                  "findings",
                  "quick_wins",
                ],

                additionalProperties:
                  false,
              },
            },
          },
        }
      );

    /* -------------------------------------------------
       READ RESPONSE
    ------------------------------------------------- */

    const content =
      completion
        .choices[0]
        ?.message
        ?.content;

    if (!content) {
      throw new Error(
        "AI returned an empty analysis."
      );
    }

    let analysis: any;

    try {
      analysis =
        JSON.parse(content);
    } catch {
      throw new Error(
        "AI returned invalid JSON."
      );
    }

    /* -------------------------------------------------
       BASIC VALIDATION
    ------------------------------------------------- */

    if (
      typeof analysis.score !==
      "number"
    ) {
      throw new Error(
        "AI response is missing a valid score."
      );
    }

    if (
      typeof analysis.summary !==
      "string"
    ) {
      throw new Error(
        "AI response is missing a summary."
      );
    }

    if (
      !Array.isArray(
        analysis.findings
      )
    ) {
      throw new Error(
        "AI response is missing findings."
      );
    }

    /* -------------------------------------------------
       FINDINGS
    ------------------------------------------------- */

    if (
      analysis.findings.length !==
      6
    ) {
      throw new Error(
        `AI returned ${analysis.findings.length} findings instead of 6.`
      );
    }

    /*
     * Normalize severity/confidence here.
     *
     * This protects the frontend even if the AI
     * returns "Moderate" or 60 instead of "medium".
     */

    const normalizedFindings =
      normalizeFindings(
        analysis.findings
      );

    /* -------------------------------------------------
       QUICK WINS
    ------------------------------------------------- */

    let quickWins: string[] = [];

    if (
      Array.isArray(
        analysis.quick_wins
      )
    ) {
      quickWins =
        analysis.quick_wins
          .filter(
            (item: unknown) =>
              typeof item ===
                "string" &&
              item.trim()
                .length > 0
          )
          .slice(0, 3);
    }

    /*
     * If Groq returns no quick wins,
     * generate them from the actual findings.
     */

    if (
      quickWins.length !== 3
    ) {
      quickWins =
        generateFallbackQuickWins(
          normalizedFindings,
          primaryGoal
        );
    }

    /* -------------------------------------------------
       SCORE NORMALIZATION
    ------------------------------------------------- */

    const normalizedScore =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            analysis.score
          )
        )
      );

    /* -------------------------------------------------
       FINAL RESPONSE
    ------------------------------------------------- */

    return NextResponse.json({
      score:
        normalizedScore,

      summary:
        analysis.summary,

      findings:
        normalizedFindings,

      quick_wins:
        quickWins,

      website:
        url,

      metrics,

      fetch_warning:
        null,
    });
  } catch (error) {
    console.error(
      "Conversion analyzer error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "Something went wrong while analyzing the website.",
      },
      {
        status: 500,
      }
    );
  }
}