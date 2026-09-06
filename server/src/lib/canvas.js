// Canvas doesn't use OAuth for this kind of integration by default — students
// generate a personal access token themselves (Canvas -> Account -> Settings
// -> "+ New Access Token") and paste it in along with their school's Canvas
// domain (e.g. "yourschool.instructure.com"). We just call the REST API with
// that token as a Bearer credential.

function normalizeDomain(domain) {
  return domain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

async function canvasRequest(domain, token, path) {
  const url = `https://${normalizeDomain(domain)}${path}`;
  let res;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error(`Couldn't reach ${normalizeDomain(domain)} — double check the domain is correct.`);
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Canvas rejected that token — check it's current and not revoked.");
    }
    throw new Error(`Canvas request failed (${res.status})`);
  }
  return res.json();
}

async function verifyCanvasToken(domain, token) {
  // /users/self is the cheapest possible authenticated call, good for
  // validating a token+domain pair before saving it.
  const me = await canvasRequest(domain, token, "/api/v1/users/self");
  return { name: me.name, id: me.id };
}

// The Planner API returns upcoming assignments/quizzes/events across every
// active course in one call, which is much simpler than walking each course
// individually.
async function fetchUpcomingPlannerItems(domain, token, { daysAhead = 14 } = {}) {
  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + daysAhead * 86400000).toISOString();
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    per_page: "50",
  });
  const items = await canvasRequest(domain, token, `/api/v1/planner/items?${params.toString()}`);

  return items
    .filter((item) => ["assignment", "quiz"].includes(item.plannable_type) && item.plannable?.due_at)
    .map((item) => ({
      sourceId: `${item.plannable_type}-${item.plannable_id}`,
      title: item.plannable.title,
      course: item.context_name || "Canvas",
      dueDate: item.plannable.due_at.slice(0, 10),
    }));
}

module.exports = { verifyCanvasToken, fetchUpcomingPlannerItems };
