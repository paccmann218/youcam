const BLOCKED: { pattern: RegExp; label: string }[] = [
  { pattern: /\bcures?\b/i, label: "cure" },
  { pattern: /\bcuring\b/i, label: "cure" },
  { pattern: /\bcured\b/i, label: "cure" },
  { pattern: /\btreat\b/i, label: "treat" },
  { pattern: /\btreating\b/i, label: "treat" },
  { pattern: /\bdiagnos(?:e|is|es|ed|ing)\b/i, label: "diagnose" },
  { pattern: /\bguaranteed\b/i, label: "guaranteed" },
  { pattern: /\bguarantee\b/i, label: "guarantee" },
  { pattern: /clinical trial/i, label: "clinical trial" },
  { pattern: /\b(?:eczema|dermatitis|rosacea|melanoma|psoriasis)\b/i, label: "condition" },
  { pattern: /\bprescription\b/i, label: "prescription" },
  { pattern: /\bhealing\b/i, label: "healing" },
];

export type LintResult = {
  ok: boolean;
  hits: string[];
  text: string;
};

export const SAFE_FALLBACK =
  "This stays a personal test. WorthIt will not phrase it as medicine.";

export function lintClaim(text: string): LintResult {
  const hits = BLOCKED.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label);
  const unique = [...new Set(hits)];
  return { ok: unique.length === 0, hits: unique, text };
}

export function guardrail(text: string): string {
  const result = lintClaim(text);
  return result.ok ? text.trim() : SAFE_FALLBACK;
}

export const PHRASE_SUITE: { text: string; expectBlocked: boolean }[] = [
  { text: "This will cure your acne.", expectBlocked: true },
  { text: "We diagnose a barrier disorder.", expectBlocked: true },
  { text: "Guaranteed results in 7 days.", expectBlocked: true },
  { text: "This is a clinical trial.", expectBlocked: true },
  { text: "Treat the dermatitis with this serum.", expectBlocked: true },
  { text: "A prescription would be required.", expectBlocked: true },
  { text: "Pores +2: within noise, don't celebrate yet.", expectBlocked: false },
  { text: "Too early. Earliest honest answer: day 19.", expectBlocked: false },
  { text: "The serum is unlikely to be the cause.", expectBlocked: false },
  { text: "Even if this is true, you couldn't see it.", expectBlocked: false },
  { text: "This is a personal test.", expectBlocked: false },
  { text: "Use it on one side of your face.", expectBlocked: false },
];
