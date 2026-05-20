// src/lib/apiEntrega.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getAuthHeader() {
  try {
    const t = localStorage.getItem("auth.access");
    if (!t) return {};
    return { Authorization: `Bearer ${t}` };
  } catch {
    return {};
  }
}

async function http(path, { method = "GET", body, headers } = {}) {
  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export const apiEntregas = {
  list: () => http("/citas/api/entregas/"),
  get: (id) => http(`/citas/api/entregas/${id}/`),

  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  remove: (id) => http(`/citas/api/entregas/${id}/`, { method: "DELETE" }),
};
