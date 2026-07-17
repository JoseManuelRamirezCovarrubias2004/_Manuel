// src/lib/apiClient.js

export const API_ROOT = (
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com"
).replace(/\/+$/, "");

const LOGIN_PATH = "/crm/login";

function cleanToken(value) {
  const token = String(value || "").trim();

  if (!token) return "";
  if (token === "undefined") return "";
  if (token === "null") return "";

  return token;
}

function isJwt(token) {
  const value = cleanToken(token);

  // JWT: header.payload.signature
  return value.split(".").length === 3;
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getAuthObject() {
  const raw = localStorage.getItem("auth");

  if (!raw || raw === "undefined" || raw === "null") {
    return null;
  }

  const parsed = safeJsonParse(raw, null);

  return parsed && typeof parsed === "object" ? parsed : null;
}

function saveAuthObject(auth) {
  try {
    localStorage.setItem("auth", JSON.stringify(auth || {}));
  } catch {
    // Sin acción.
  }
}

export function getStoredUser() {
  const auth = getAuthObject();

  if (auth?.user && typeof auth.user === "object") {
    return auth.user;
  }

  const candidateKeys = ["crm.user", "user"];

  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") continue;

    const parsed = safeJsonParse(raw, null);

    if (!parsed || typeof parsed !== "object") continue;

    if (parsed.user && typeof parsed.user === "object") {
      return parsed.user;
    }

    return parsed;
  }

  return null;
}

export function getAccessToken() {
  const directCandidates = [
    localStorage.getItem("@token_access_jwt"),
    localStorage.getItem("auth.access"),
    localStorage.getItem("access"),
    localStorage.getItem("accessToken"),
    localStorage.getItem("token"),
    localStorage.getItem("authToken"),
  ];

  for (const candidate of directCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  const auth = getAuthObject();

  const authCandidates = [
    auth?.access,
    auth?.access_token,
    auth?.token,
    auth?.jwt,
    auth?.auth?.access,
    auth?.auth?.token,
  ];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  return "";
}

export function getRefreshToken() {
  const directCandidates = [
    localStorage.getItem("@token_refresh_jwt"),
    localStorage.getItem("auth.refresh"),
    localStorage.getItem("refresh"),
    localStorage.getItem("refreshToken"),
  ];

  for (const candidate of directCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  const auth = getAuthObject();

  const authCandidates = [
    auth?.refresh,
    auth?.refresh_token,
    auth?.auth?.refresh,
  ];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  return "";
}

export function saveJwtTokens({ access, refresh, user } = {}) {
  const accessToken = cleanToken(access);
  const refreshToken = cleanToken(refresh);

  const auth = getAuthObject() || {};
  const storedUser = user || getStoredUser() || auth.user || null;

  if (storedUser) {
    auth.user = storedUser;

    try {
      localStorage.setItem("crm.user", JSON.stringify(storedUser));
      localStorage.setItem("user", JSON.stringify(storedUser));
    } catch {
      // Sin acción.
    }
  }

  if (isJwt(accessToken)) {
    localStorage.setItem("@token_access_jwt", accessToken);
    localStorage.setItem("auth.access", accessToken);
    localStorage.setItem("access", accessToken);

    auth.access = accessToken;
    auth.token = accessToken;
  }

  if (isJwt(refreshToken)) {
    localStorage.setItem("@token_refresh_jwt", refreshToken);
    localStorage.setItem("auth.refresh", refreshToken);
    localStorage.setItem("refresh", refreshToken);

    auth.refresh = refreshToken;
  }

  saveAuthObject(auth);
}

export function clearJwtTokens() {
  const keys = [
    "@token_access_jwt",
    "@token_refresh_jwt",
    "auth.access",
    "auth.refresh",
    "auth.token",
    "access",
    "accessToken",
    "refresh",
    "refreshToken",
    "token",
    "authToken",
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
    delete auth.refresh;
    delete auth.token;
    delete auth.access_token;
    delete auth.refresh_token;
    delete auth.jwt;

    saveAuthObject(auth);
  }
}

export function getAuthHeader() {
  const token = getAccessToken();

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getWebSocketAuthQuery() {
  const token = getAccessToken();

  if (!token) return "";

  return `token=${encodeURIComponent(token)}`;
}

function redirectToLogin() {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
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
    throw new Error("No hay refresh token disponible.");
  }

  const res = await fetch(`${API_ROOT}/conformidad/api/auth/token/refresh/`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await parseResponseData(res);

  if (!res.ok || !data?.access) {
    throw new Error(data?.detail || "No se pudo renovar la sesión.");
  }

  saveJwtTokens({
    access: data.access,
    refresh,
    user: getStoredUser(),
  });

  return data.access;
}

function isFormData(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isBlobLike(body) {
  return typeof Blob !== "undefined" && body instanceof Blob;
}

function buildUrl(path) {
  const value = String(path || "");

  if (/^https?:\/\//i.test(value)) return value;

  return `${API_ROOT}${value.startsWith("/") ? value : `/${value}`}`;
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

  if (typeof data === "string" && data.trim()) return data;

  return (
    data?.detail ||
    data?.error ||
    data?.mensaje ||
    data?.message ||
    getFirstFieldError(data) ||
    `HTTP ${status}`
  );
}

function shouldRedirectOnUnauthorized(path) {
  const value = String(path || "");

  // Rutas públicas: no conviene mandar al login del CRM.
  return !value.includes("/api/public/");
}

function buildHeaders({ headers = {}, body, auth = true } = {}) {
  const token = auth ? getAccessToken() : "";

  const finalHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  if (isFormData(body)) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
    return finalHeaders;
  }

  const hasBody = body !== undefined && body !== null;

  if (hasBody && !isBlobLike(body) && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  return finalHeaders;
}

function buildBody({ body, data } = {}) {
  if (data !== undefined) return JSON.stringify(data);

  if (body === undefined || body === null) return body;
  if (typeof body === "string") return body;
  if (isFormData(body) || isBlobLike(body)) return body;

  return JSON.stringify(body);
}

export async function http(
  path,
  {
    method = "GET",
    body,
    data,
    headers = {},
    signal,
    auth = true,
    retryRefresh = true,
    retryWithoutAuth = true,
    redirectOnUnauthorized = shouldRedirectOnUnauthorized(path),
  } = {},
) {
  const finalBody = buildBody({ body, data });

  const finalHeaders = buildHeaders({
    headers,
    body: finalBody,
    auth,
  });

  const res = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: finalBody,
    signal,
  });

  const responseData = await parseResponseData(res);

  if (res.status === 401 && auth && retryRefresh) {
    try {
      await refreshAccessToken();

      return http(path, {
        method,
        body,
        data,
        headers,
        signal,
        auth: true,
        retryRefresh: false,
        retryWithoutAuth,
        redirectOnUnauthorized,
      });
    } catch {
      clearJwtTokens();

      // Permite que endpoints AllowAny no fallen por un Bearer inválido.
      if (retryWithoutAuth) {
        return http(path, {
          method,
          body,
          data,
          headers,
          signal,
          auth: false,
          retryRefresh: false,
          retryWithoutAuth: false,
          redirectOnUnauthorized,
        });
      }
    }
  }

  if (!res.ok) {
  const message = resolveErrorMessage(responseData, res.status);
  const error = new Error(message);

  error.status = res.status;
  error.data = responseData;
  error.code = res.status === 401 ? "SESSION_EXPIRED" : "API_ERROR";

  // 👇 AGREGA ESTO
  console.log("========== ERROR DEL BACK ==========");
  console.log(responseData);
  console.log("===================================");

  if (res.status === 401) {
    clearJwtTokens();

    if (redirectOnUnauthorized) {
      redirectToLogin();
    }
  }

  throw error;
}

  return responseData;
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (value === "Todos" || value === "Todas") return;
    query.append(key, value);
  });

  const text = query.toString();

  return text ? `?${text}` : "";
}
