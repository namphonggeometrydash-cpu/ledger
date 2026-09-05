const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const STORAGE_KEY = "ledger.token";

let token = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || null;

// remember=true persists across browser restarts (localStorage);
// remember=false clears on tab/browser close (sessionStorage).
export function setToken(next, remember = true) {
  token = next;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (next) {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, next);
  }
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() throws a generic TypeError for any network-level failure —
    // wrong URL, backend not running, CORS block, offline, etc. Give a
    // concrete, actionable message instead of the browser's raw one.
    throw new Error(
      `Couldn't reach the server at ${BASE_URL}. Make sure the backend is running ` +
        `(cd server && npm run dev) and that VITE_API_URL points at it.`
    );
  }

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  google: (idToken) => request("/auth/google", { method: "POST", body: JSON.stringify({ idToken }) }),
  me: () => request("/me"),

  tasks: {
    list: () => request("/tasks"),
    create: (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
    update: (id, patch) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  },
  sessions: {
    list: () => request("/sessions"),
    create: (durationMins) => request("/sessions", { method: "POST", body: JSON.stringify({ durationMins }) }),
  },
  goals: {
    list: () => request("/goals"),
  },
  inbox: {
    list: () => request("/inbox"),
    dismiss: (id) => request(`/inbox/${id}`, { method: "DELETE" }),
  },
};
