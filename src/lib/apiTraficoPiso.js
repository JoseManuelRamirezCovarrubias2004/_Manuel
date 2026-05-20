const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getStoredToken() {
  try {
    const access = localStorage.getItem("auth.access");
    if (access && access !== "undefined" && access !== "null") return access;

    const rawAuth = localStorage.getItem("auth");
    if (!rawAuth) return null;

    const parsed = JSON.parse(rawAuth);
    return parsed?.token || parsed?.access || null;
  } catch {
    return null;
  }
}

function getAuthHeader() {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function parseError(res) {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => null);
    if (!data) return `HTTP ${res.status}`;

    if (typeof data === "string") return data;
    if (data.detail) return data.detail;

    const partes = [];
    Object.entries(data).forEach(([campo, valor]) => {
      if (Array.isArray(valor)) partes.push(`${campo}: ${valor.join(" ")}`);
      else if (typeof valor === "object" && valor !== null)
        partes.push(`${campo}: ${JSON.stringify(valor)}`);
      else partes.push(`${campo}: ${valor}`);
    });

    return partes.join(" | ") || `HTTP ${res.status}`;
  }

  return (await res.text().catch(() => "")) || `HTTP ${res.status}`;
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
    throw new Error(await parseError(res));
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function toQuery(params = {}) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.append(key, value);
  });

  const query = qs.toString();
  return query ? `?${query}` : "";
}

const BASE = "/trafico-piso/api/trafico-piso";

export const apiTraficoPiso = {
  list: (params = {}) => http(`${BASE}/${toQuery(params)}`),

  get: (id) => http(`${BASE}/${id}/`),

  create: (payload) =>
    http(`${BASE}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`${BASE}/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  remove: (id) => http(`${BASE}/${id}/`, { method: "DELETE" }),

  asesoresVentas: (q = "") => http(`${BASE}/asesores-ventas/${toQuery({ q })}`),

  resumen: (params = {}) => http(`${BASE}/resumen/${toQuery(params)}`),
};
