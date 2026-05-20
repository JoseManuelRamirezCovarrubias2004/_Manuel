// src/lib/apiCredito.js
const API = (
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com"
).replace(/\/+$/, "");

function safeParseJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getStoredToken() {
  try {
    const directAccess = localStorage.getItem("auth.access");
    if (
      directAccess &&
      directAccess !== "undefined" &&
      directAccess !== "null"
    ) {
      return directAccess;
    }

    const rawAuth = localStorage.getItem("auth");
    if (rawAuth && rawAuth !== "undefined" && rawAuth !== "null") {
      const parsed = safeParseJson(rawAuth, null);

      const token =
        parsed?.token ||
        parsed?.access ||
        parsed?.access_token ||
        parsed?.auth?.token ||
        parsed?.auth?.access ||
        null;

      if (token && token !== "undefined" && token !== "null") {
        return token;
      }
    }

    const fallbackToken =
      localStorage.getItem("token") || localStorage.getItem("access") || null;

    if (
      fallbackToken &&
      fallbackToken !== "undefined" &&
      fallbackToken !== "null"
    ) {
      return fallbackToken;
    }

    return null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  const keys = [
    "auth",
    "auth.access",
    "auth.token",
    "token",
    "access",
    "refresh",
    "auth.refresh",
  ];

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // nada
    }
  });
}

function buildHeaders({ headers = {}, body } = {}) {
  const token = getStoredToken();

  const finalHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const isFormData = body instanceof FormData;
  const hasBody = body !== undefined && body !== null;

  if (hasBody && !isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return finalHeaders;
}

async function parseResponseData(res) {
  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    return text ? { detail: text } : null;
  } catch {
    return null;
  }
}

function resolveErrorMessage(data, status) {
  if (!data) return `HTTP ${status}`;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  return `HTTP ${status}`;
}

function isSessionError(status, message) {
  const text = String(message || "").toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    text.includes("token expirado") ||
    text.includes("token inválido") ||
    text.includes("token invalido") ||
    text.includes("authentication credentials were not provided") ||
    text.includes("credenciales de autenticación") ||
    text.includes("credenciales de autenticacion")
  );
}

async function http(path, { method = "GET", body, headers } = {}) {
  const finalHeaders = buildHeaders({ headers, body });

  let finalBody = body;
  const isFormData = body instanceof FormData;

  if (
    body !== undefined &&
    body !== null &&
    !isFormData &&
    typeof body !== "string"
  ) {
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  const data = await parseResponseData(res);

  if (!res.ok) {
    const message = resolveErrorMessage(data, res.status);
    const error = new Error(message);

    error.status = res.status;
    error.data = data;

    if (isSessionError(res.status, message)) {
      clearStoredSession();
      error.code = "SESSION_EXPIRED";
    } else {
      error.code = "API_ERROR";
    }

    throw error;
  }

  if (res.status === 204) return null;
  return data;
}

export const apiCredito = {
  list: () => http("/financieros/api/solicitudes-credito/"),

  get: (id) => http(`/financieros/api/solicitudes-credito/${id}/`),

  create: (payload) =>
    http("/financieros/api/solicitudes-credito/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "DELETE",
    }),
};
