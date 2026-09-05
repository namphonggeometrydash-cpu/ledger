// Lightweight, explainable heuristic for flagging likely spam/phishing mail.
// This stands in for a trained classifier: it looks for well-known signals
// (urgency, money hooks, mismatched sender domains, excess punctuation) and
// returns a score plus the specific reasons, so a student can see *why*
// something was flagged instead of trusting a black box.
//
// In a production build, swap `scoreMessage` for a call to a trained model
// or an LLM classification prompt — the shape of the return value
// ({ score, reasons }) can stay the same so the UI does not need to change.

const URGENCY_WORDS = ["urgent", "immediately", "act now", "within 24 hours", "verify your", "suspended", "act fast"];
const MONEY_WORDS = ["gift card", "won", "winner", "claim", "prize", "free money", "cash reward"];
const TRUSTED_DOMAIN_HINTS = ["school.edu", "canvas", "classroom.google.com"];

export function scoreMessage({ from = "", subject = "", preview = "" }) {
  const text = `${subject} ${preview}`.toLowerCase();
  const reasons = [];
  let score = 0;

  URGENCY_WORDS.forEach((w) => {
    if (text.includes(w)) {
      score += 2;
      reasons.push(`Uses urgency language ("${w}")`);
    }
  });

  MONEY_WORDS.forEach((w) => {
    if (text.includes(w)) {
      score += 2;
      reasons.push(`Mentions a prize or money hook ("${w}")`);
    }
  });

  const exclamations = (subject.match(/!/g) || []).length;
  if (exclamations >= 2) {
    score += 1;
    reasons.push("Excessive punctuation in the subject line");
  }

  const looksTrusted = TRUSTED_DOMAIN_HINTS.some((hint) => from.toLowerCase().includes(hint));
  if (!looksTrusted && (from.includes("-") || /\d{2,}/.test(from))) {
    score += 1;
    reasons.push("Sender domain looks unusual, not a known school or platform domain");
  }

  return { score, reasons, suspicious: score >= 2 };
}
