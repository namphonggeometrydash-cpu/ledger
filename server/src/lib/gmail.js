const { scoreMessage } = require("./spamHeuristic");

function headerValue(headers, name) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

async function fetchRecentMessages(accessToken, { maxResults = 15 } = {}) {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) throw new Error(`Gmail list request failed (${listRes.status})`);
  const { messages = [] } = await listRes.json();

  const detailed = await Promise.all(
    messages.map(async (m) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}` +
          `?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      const msg = await res.json();
      const headers = msg.payload?.headers || [];
      const from = headerValue(headers, "From");
      const subject = headerValue(headers, "Subject");
      const preview = msg.snippet || "";
      const scored = scoreMessage({ from, subject, preview });
      return {
        id: m.id,
        from,
        subject,
        preview,
        flag: scored.suspicious ? "suspicious" : "safe",
        reasons: scored.reasons,
        receivedAt: headerValue(headers, "Date"),
      };
    })
  );

  return detailed.filter(Boolean);
}

module.exports = { fetchRecentMessages };
