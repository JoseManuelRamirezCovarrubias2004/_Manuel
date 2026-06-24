//volkswagen
// src/lib/apiPruebas.js

const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const LOGIN_PATH = "/login";

function isFormData(x) {
  return typeof FormData !== "undefined" && x instanceof FormData;
}

function cleanToken(value) {
  const token = String(value || "").trim();

  if (!token) return "";
  if (token === "undefined") return "";
  if (token === "null") return "";

  return token;
}

function isJwt(token) {
  const value = cleanToken(token);
  return value.split(".").length === 3;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getAuthObject() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;

    const parsed = tryParseJson(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveAuthObject(nextAuth) {
  try {
    localStorage.setItem("auth", JSON.stringify(nextAuth || {}));
  } catch {
    // Sin acción.
  }
}

function getStoredUserObject() {
  const auth = getAuthObject();

  if (auth?.user && typeof auth.user === "object") {
    return auth.user;
  }

  const candidateKeys = ["crm.user", "user"];

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = tryParseJson(raw);
      if (!parsed || typeof parsed !== "object") continue;

      if (parsed.user && typeof parsed.user === "object") {
        return parsed.user;
      }

      return parsed;
    } catch {
      // Seguir buscando.
    }
  }

  return null;
}

function getAccessToken() {
  const directCandidates = [
    localStorage.getItem("@token_access_jwt"),
    localStorage.getItem("auth.access"),
    localStorage.getItem("access"),
    localStorage.getItem("token"),
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
  ];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  return "";
}

function getRefreshToken() {
  const directCandidates = [
    localStorage.getItem("@token_refresh_jwt"),
    localStorage.getItem("auth.refresh"),
    localStorage.getItem("refresh"),
  ];

  for (const candidate of directCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  const auth = getAuthObject();

  const authCandidates = [auth?.refresh, auth?.refresh_token];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);
    if (isJwt(token)) return token;
  }

  return "";
}

function getAuthHeader() {
  const token = getAccessToken();

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

function saveJwtTokens({ access, refresh } = {}) {
  const accessToken = cleanToken(access);
  const refreshToken = cleanToken(refresh);

  const auth = getAuthObject() || {};
  const user = getStoredUserObject() || auth.user || null;

  const nextAuth = {
    ...auth,
    ...(user ? { user } : {}),
  };

  if (isJwt(accessToken)) {
    localStorage.setItem("@token_access_jwt", accessToken);
    localStorage.setItem("auth.access", accessToken);

    nextAuth.access = accessToken;
    nextAuth.token = accessToken;
  }

  if (isJwt(refreshToken)) {
    localStorage.setItem("@token_refresh_jwt", refreshToken);
    localStorage.setItem("auth.refresh", refreshToken);

    nextAuth.refresh = refreshToken;
  }

  saveAuthObject(nextAuth);
}

function clearJwtTokensOnly() {
  const keys = [
    "@token_access_jwt",
    "@token_refresh_jwt",
    "auth.access",
    "auth.refresh",
    "auth.token",
    "access",
    "refresh",
    "token",
  ];

  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Sin acción.
    }
  }

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

function clearFullSession() {
  clearJwtTokensOnly();

  try {
    localStorage.removeItem("auth");
  } catch {
    // Sin acción.
  }
}

function redirectToLogin() {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new Error("No hay refresh token.");
  }

  const res = await fetch(`${API}/conformidad/api/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.access) {
    throw new Error(data?.detail || "No se pudo refrescar el token.");
  }

  saveJwtTokens({
    access: data.access,
    refresh,
  });

  return data.access;
}

function normalizaTelefonoMx(tel) {
  const digits = String(tel || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("521") && digits.length === 13) {
    return `52${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  return digits;
}

function getCrmUsername() {
  const user = getStoredUserObject();

  if (!user) return "";

  return String(
    user.usuario ||
      user.username ||
      user.user ||
      user.nombre_usuario ||
      user.correo ||
      user.email ||
      "",
  ).trim();
}

function getWhatsAppNumberFromSources() {
  const user = getStoredUserObject();

  if (!user) return "";

  const numero = normalizaTelefonoMx(
    user.telefono ||
      user.numero_asesor ||
      user.whatsapp_number ||
      user.phone ||
      "",
  );

  return numero || "";
}

function withRequestContext(payload = {}) {
  const numero = getWhatsAppNumberFromSources();
  const usuario = getCrmUsername();

  return {
    ...payload,
    ...(numero ? { numero_asesor: numero } : {}),
    ...(usuario ? { usuario } : {}),
  };
}

function buildQuery(params) {
  const qs = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });

  const query = qs.toString();
  return query ? `?${query}` : "";
}

function appendContextToFormData(fd) {
  const numero = getWhatsAppNumberFromSources();
  const usuario = getCrmUsername();

  if (numero) fd.append("numero_asesor", numero);
  if (usuario) fd.append("usuario", usuario);
}

async function parseErrorResponse(res) {
  const text = await res.text().catch(() => "");

  if (!text) return `HTTP ${res.status}`;

  const json = tryParseJson(text);

  if (json?.detail) return json.detail;
  if (json?.error) return json.error;
  if (json?.message) return json.message;

  return text;
}

async function http(
  path,
  {
    method = "GET",
    body,
    headers,
    _retryRefresh = true,
    _retryWithoutAuth = true,
  } = {},
) {
  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  if (isFormData(body)) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body,
  });

  if (res.status === 401 && _retryRefresh) {
    try {
      await refreshAccessToken();

      return http(path, {
        method,
        body,
        headers,
        _retryRefresh: false,
        _retryWithoutAuth,
      });
    } catch {
      clearJwtTokensOnly();

      if (_retryWithoutAuth) {
        return http(path, {
          method,
          body,
          headers,
          _retryRefresh: false,
          _retryWithoutAuth: false,
        });
      }
    }
  }

  if (res.status === 401) {
    clearFullSession();
    redirectToLogin();
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  if (!res.ok) {
    const message = await parseErrorResponse(res);
    throw new Error(message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

export const api = {
  // Helpers genéricos
  get: (path) => http(path),

  post: (path, payload) =>
    http(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }),

  patch: (path, payload) =>
    http(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }),

  put: (path, payload) =>
    http(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }),

  delete: (path) =>
    http(path, {
      method: "DELETE",
    }),

  // Prospectos digitales
  digitalesListProspectos: () => http("/digitales/api/prospectos/"),

  digitalesGetProspecto: (id) => http(`/digitales/api/prospectos/${id}/`),

  digitalesCreateProspecto: (payload) =>
    http("/digitales/api/prospectos/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesUpdateProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesPatchProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesDeleteProspecto: (id) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "DELETE",
    }),

  digitalesGenerarResumen: (id) =>
    http(`/digitales/api/prospectos/${id}/generar-resumen/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }),

  digitalesCampanasMeta: (days = 30) =>
    http(`/digitales/api/campanas-meta/?days=${encodeURIComponent(days)}`),

  // Chats WhatsApp
  digitalesChats: () => {
    const numero = getWhatsAppNumberFromSources();
    const usuario = getCrmUsername();

    return http(
      `/digitales/chats/${buildQuery({
        numero_asesor: numero,
        usuario,
      })}`,
    );
  },

  digitalesMarkRead: (tel) =>
    http("/digitales/chats/mark-read/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ tel })),
    }),

  digitalesMarkUnread: ({ tel }) =>
    http("/digitales/chats/mark-unread/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ tel })),
    }),

  digitalesContacto: (
    tel,
    {
      limit = 20,
      before_id = "",
      usuario = "",
      numero_asesor = "",
      mark_read = 1,
    } = {},
  ) => {
    const numero = numero_asesor || getWhatsAppNumberFromSources();
    const user = usuario || getCrmUsername();

    return http(
      `/digitales/contacto/${buildQuery({
        tel,
        limit,
        before_id,
        mark_read,
        numero_asesor: numero,
        usuario: user,
      })}`,
    );
  },

  digitalesContactoUpdates: (
    tel,
    after = "",
    { limit = 50, usuario = "", numero_asesor = "", after_id = "" } = {},
  ) => {
    const numero = numero_asesor || getWhatsAppNumberFromSources();
    const user = usuario || getCrmUsername();

    return http(
      `/digitales/contacto/updates/${buildQuery({
        tel,
        after,
        after_id,
        limit,
        numero_asesor: numero,
        usuario: user,
      })}`,
    );
  },

  // Envío de mensajes
  digitalesEnviarMensaje: ({ to, text, reply_to_message_id = "" }) =>
    http("/digitales/mensajes/enviar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        withRequestContext({
          to,
          text,
          reply_to_message_id,
        }),
      ),
    }),

  digitalesEnviarPlantilla: (payload) =>
    http("/digitales/mensajes/enviar-plantilla/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesEnviarMedia: ({
    to,
    text = "",
    files = [],
    reply_to_message_id = "",
  }) => {
    const fd = new FormData();

    fd.append("to", String(to || "").trim());

    if (text) {
      fd.append("text", String(text));
    }

    if (reply_to_message_id) {
      fd.append("reply_to_message_id", String(reply_to_message_id));
    }

    appendContextToFormData(fd);

    const arr = Array.isArray(files) ? files : Array.from(files || []);

    arr.forEach((file) => {
      if (file) fd.append("files", file);
    });

    return http("/digitales/mensajes/enviar-media/", {
      method: "POST",
      body: fd,
    });
  },

  digitalesEditarMensaje: ({ to, message_id, text }) =>
    http("/digitales/mensajes/editar/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ to, message_id, text })),
    }),

  digitalesEliminarMensaje: ({ to, message_id }) =>
    http("/digitales/mensajes/eliminar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ to, message_id })),
    }),

  digitalesPlantillas: () => {
    const numero = getWhatsAppNumberFromSources();
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/${buildQuery({
        numero_asesor: numero,
        usuario,
      })}`,
    );
  },

  digitalesLlamarWhatsapp: ({ telefono, sdp_offer = "" }) =>
    http("/digitales/llamar-whatsapp/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ telefono, sdp_offer })),
    }),

  // Configuración IA
  iaLineas: () => http("/digitales/ia/lineas/"),

  iaConfigGet: (numeroAsesor) =>
    http(`/digitales/ia/config/${encodeURIComponent(numeroAsesor)}/`),

  iaConfigPatch: (numeroAsesor, payload) =>
    http(`/digitales/ia/config/${encodeURIComponent(numeroAsesor)}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  iaConfigPublicar: (numeroAsesor) =>
    http(`/digitales/ia/config/${encodeURIComponent(numeroAsesor)}/publicar/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({})),
    }),

  iaPausarConversacion: ({ tel, motivo = "manual", numero_asesor = "" }) => {
    const payload = {
      tel,
      motivo,
      ...(numero_asesor ? { numero_asesor } : {}),
    };

    return http("/digitales/ia/conversacion/pausar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    });
  },

  iaReactivarConversacion: ({ tel, numero_asesor = "" }) => {
    const payload = {
      tel,
      ...(numero_asesor ? { numero_asesor } : {}),
    };

    return http("/digitales/ia/conversacion/reactivar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    });
  },

  iaEstadoConversacion: ({ tel, numero_asesor = "" }) => {
    const numero = numero_asesor || getWhatsAppNumberFromSources();
    const usuario = getCrmUsername();

    return http(
      `/digitales/ia/conversacion/estado/${buildQuery({
        tel,
        numero_asesor: numero,
        usuario,
      })}`,
    );
  },

  // Catálogo IA
  catalogoVehiculos: ({
    activo = "true",
    limit = 1000,
    modelo = "",
    marca = "",
  } = {}) =>
    http(
      `/digitales/catalogo/vehiculos/${buildQuery({
        activo,
        limit,
        modelo,
        marca,
      })}`,
    ),

  catalogoVehiculoCreate: (payload) =>
    http("/digitales/catalogo/vehiculos/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  catalogoVehiculoPatch: (id, payload) =>
    http(`/digitales/catalogo/vehiculos/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  catalogoVehiculoDelete: (id) =>
    http(`/digitales/catalogo/vehiculos/${id}/`, {
      method: "DELETE",
    }),
};

export {
  http,
  normalizaTelefonoMx,
  getCrmUsername,
  getWhatsAppNumberFromSources,
};
