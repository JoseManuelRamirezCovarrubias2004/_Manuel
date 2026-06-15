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

function cleanToken(value) {
  const token = String(value || "").trim();

  if (!token) return "";
  if (token === "undefined") return "";
  if (token === "null") return "";

  return token;
}

function looksLikeJwt(token) {
  const value = cleanToken(token);

  // JWT = header.payload.signature
  return value.split(".").length === 3;
}

function getAuthObject() {
  const raw = localStorage.getItem("auth");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  const parsed = safeParseJson(raw, null);

  return parsed && typeof parsed === "object" ? parsed : null;
}

function getAccessToken() {
  const auth = getAuthObject();

  const candidates = [
    localStorage.getItem("@token_access_jwt"),
    localStorage.getItem("access"),
    localStorage.getItem("accessToken"),

    auth?.access,
    auth?.access_token,
    auth?.jwt,
    auth?.auth?.access,

    // Al final porque en tu proyecto pueden venir de tokens viejos.
    localStorage.getItem("auth.access"),
    localStorage.getItem("token"),
    localStorage.getItem("authToken"),
    auth?.token,
    auth?.auth?.token,
  ];

  for (const candidate of candidates) {
    const token = cleanToken(candidate);

    if (looksLikeJwt(token)) {
      return token;
    }
  }

  return "";
}

function getRefreshToken() {
  const auth = getAuthObject();

  const candidates = [
    localStorage.getItem("@token_refresh_jwt"),
    localStorage.getItem("refresh"),
    localStorage.getItem("refreshToken"),
    localStorage.getItem("auth.refresh"),

    auth?.refresh,
    auth?.refresh_token,
    auth?.auth?.refresh,
  ];

  for (const candidate of candidates) {
    const token = cleanToken(candidate);

    if (looksLikeJwt(token)) {
      return token;
    }
  }

  return "";
}

function saveJwtTokens({ access, refresh } = {}) {
  const accessToken = cleanToken(access);
  const refreshToken = cleanToken(refresh);

  if (!looksLikeJwt(accessToken)) return;

  const auth = getAuthObject() || {};

  auth.access = accessToken;

  // Solo actualizamos auth.token si el token anterior no existe o si también era JWT.
  // Esto evita romper módulos viejos que todavía dependan de auth.token.
  if (!auth.token || looksLikeJwt(auth.token)) {
    auth.token = accessToken;
  }

  localStorage.setItem("@token_access_jwt", accessToken);
  localStorage.setItem("access", accessToken);
  localStorage.setItem("auth.access", accessToken);

  if (looksLikeJwt(refreshToken)) {
    auth.refresh = refreshToken;

    localStorage.setItem("@token_refresh_jwt", refreshToken);
    localStorage.setItem("refresh", refreshToken);
    localStorage.setItem("auth.refresh", refreshToken);
  }

  localStorage.setItem("auth", JSON.stringify(auth));
}

function clearCreditoJwtOnly() {
  const keys = [
    "@token_access_jwt",
    "@token_refresh_jwt",
    "access",
    "accessToken",
    "refresh",
    "refreshToken",
    "auth.refresh",
  ];

  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Sin acción.
    }
  });

  const auth = getAuthObject();

  if (auth && typeof auth === "object") {
    delete auth.access;
    delete auth.access_token;
    delete auth.refresh;
    delete auth.refresh_token;
    delete auth.jwt;

    // Solo borramos auth.token si parece JWT. Si es token viejo, lo dejamos.
    if (looksLikeJwt(auth.token)) {
      delete auth.token;
    }

    localStorage.setItem("auth", JSON.stringify(auth));
  }
}

async function parseResponseData(res) {
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new Error("No hay refresh token JWT disponible.");
  }

  const res = await fetch(`${API}/conformidad/api/auth/token/refresh/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await parseResponseData(res);

  if (!res.ok || !data?.access) {
    throw new Error(data?.detail || "No se pudo renovar el token JWT.");
  }

  saveJwtTokens({
    access: data.access,
    refresh,
  });

  return data.access;
}

function buildHeaders({ headers = {}, body, token = "" } = {}) {
  const finalHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const hasBody = body !== undefined && body !== null;

  if (isFormData) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
    return finalHeaders;
  }

  if (hasBody && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return finalHeaders;
}

function buildBody(body) {
  if (body === undefined || body === null) return body;
  if (typeof body === "string") return body;

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return body;
  }

  return JSON.stringify(body);
}

function getFirstFieldError(data) {
  if (!data || typeof data !== "object") return "";

  const firstKey = Object.keys(data)[0];
  if (!firstKey) return "";

  const value = data[firstKey];

  if (Array.isArray(value)) return `${firstKey}: ${value.join(", ")}`;
  if (typeof value === "string") return `${firstKey}: ${value}`;
  if (value && typeof value === "object") {
    return `${firstKey}: ${JSON.stringify(value)}`;
  }

  return "";
}

function resolveErrorMessage(data, status) {
  if (!data) return `HTTP ${status}`;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return (
    data?.detail ||
    data?.error ||
    data?.mensaje ||
    data?.message ||
    getFirstFieldError(data) ||
    `HTTP ${status}`
  );
}

function isJwtErrorMessage(message) {
  const text = String(message || "").toLowerCase();

  return (
    text.includes("given token not valid") ||
    text.includes("token not valid") ||
    text.includes("token inválido") ||
    text.includes("token invalido") ||
    text.includes("token expirado") ||
    text.includes("authentication credentials were not provided") ||
    text.includes("credentials") ||
    text.includes("jwt")
  );
}

async function http(
  path,
  { method = "GET", body, headers, retry = true } = {},
) {
  const finalBody = buildBody(body);

  let token = getAccessToken();

  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      token = "";
    }
  }

  if (!token) {
    const error = new Error("No hay access token JWT disponible para Crédito.");
    error.status = 401;
    error.code = "SESSION_EXPIRED";
    throw error;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers: buildHeaders({
      headers,
      body: finalBody || body,
      token,
    }),
    body: finalBody,
  });

  const data = await parseResponseData(res);

  if ((res.status === 401 || res.status === 403) && retry) {
    const message = resolveErrorMessage(data, res.status);

    if (isJwtErrorMessage(message)) {
      try {
        const newAccess = await refreshAccessToken();

        return http(path, {
          method,
          body,
          headers,
          retry: false,
        });
      } catch {
        clearCreditoJwtOnly();
      }
    }
  }

  if (!res.ok) {
    const message = resolveErrorMessage(data, res.status);

    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    error.code =
      res.status === 401 || res.status === 403 || isJwtErrorMessage(message)
        ? "SESSION_EXPIRED"
        : "API_ERROR";

    throw error;
  }

  return data;
}

function encodeId(id) {
  return encodeURIComponent(String(id));
}

export const apiCredito = {
  list: () => http("/financieros/api/solicitudes-credito/"),

  get: (id) => http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`),

  create: (payload) =>
    http("/financieros/api/solicitudes-credito/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/solicitudes-credito/${encodeId(id)}/`, {
      method: "DELETE",
    }),
};
