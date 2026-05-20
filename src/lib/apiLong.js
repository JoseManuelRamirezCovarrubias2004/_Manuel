// src/lib/apiLong.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
//import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getStoredToken() {
  try {
    const access = localStorage.getItem("auth.access");
    if (access && access !== "undefined" && access !== "null") {
      return access;
    }

    const rawAuth = localStorage.getItem("auth");
    if (!rawAuth) return null;

    const parsed = JSON.parse(rawAuth);
    const token = parsed?.token;

    if (token && token !== "undefined" && token !== "null") {
      return token;
    }

    return null;
  } catch {
    return null;
  }
}

function getAuthHeader() {
  const token = getStoredToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function parseResponseError(res) {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return data?.detail || data?.message || JSON.stringify(data);
    }

    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
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
    const message = await parseResponseError(res);
    throw new Error(message);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

export const apiLong = {
  list: () => http("/financieros/api/long-drives/"),

  get: (id) => http(`/financieros/api/long-drives/${id}/`),

  create: (payload) =>
    http("/financieros/api/long-drives/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "DELETE",
    }),
};
