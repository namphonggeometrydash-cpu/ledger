// Same logic as src/lib/spamHeuristic.js on the frontend (kept in sync by
// hand since one runs in the browser and one on the server). See that file
// for the full rationale/comments.

const URGENCY_WORDS = ["urgent", "immediately", "act now", "within 24 hours", "verify your", "suspended", "act fast"];
const MONEY_WORDS = ["gift card", "won", "winner", "claim", "prize", "free money", "cash reward"];
const TRUSTED_DOMAIN_HINTS = ["school.edu", "canvas", "classroom.google.com"];

function scoreMessage({ from = "", subject = "", preview = "" }) {
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

module.exports = { scoreMessage };
