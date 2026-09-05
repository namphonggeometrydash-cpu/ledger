const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let token = localStorage.getItem("ledger.token") || null;

export function setToken(next) {
  token = next;
  if (next) localStorage.setItem("ledger.token", next);
  else localStorage.removeItem("ledger.token");
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

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
