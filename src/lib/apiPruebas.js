//volkswagen
// src/lib/apiPruebas.js

const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const LOGIN_PATH = "/login";

const ACCESS_REFRESH_MARGIN_SECONDS = 60;

let refreshTokenPromise = null;

function createAuthError(
  message,
  { code = "AUTH_ERROR", status = 0, rejected = false, cause = null } = {},
) {
  const error = new Error(message);

  error.code = code;
  error.status = status;
  error.authRejected = rejected;
  error.cause = cause;

  return error;
}

function decodeJwtPayload(token) {
  const value = cleanToken(token);

  if (!isJwt(value)) {
    return null;
  }

  try {
    const payloadPart = value.split(".")[1];

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function jwtExpiresSoon(token, marginSeconds = ACCESS_REFRESH_MARGIN_SECONDS) {
  const payload = decodeJwtPayload(token);
  const expiresAt = Number(payload?.exp || 0);

  if (!expiresAt) {
    return false;
  }

  const currentSeconds = Math.floor(Date.now() / 1000);

  return expiresAt - currentSeconds <= marginSeconds;
}

function isRefreshEndpoint(path) {
  return String(path || "").includes("/api/auth/token/refresh/");
}

function isLoginEndpoint(path) {
  return String(path || "").includes("/api/auth/login/");
}

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

async function executeRefreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw createAuthError("No hay refresh token disponible.", {
      code: "REFRESH_TOKEN_MISSING",
      rejected: true,
    });
  }

  let res;

  try {
    res = await fetch(`${API}/conformidad/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh,
      }),
    });
  } catch (cause) {
    /*
     * No eliminamos la sesión por un fallo
     * temporal de red.
     */
    throw createAuthError(
      "No se pudo conectar con el servidor para renovar la sesión.",
      {
        code: "REFRESH_NETWORK_ERROR",
        cause,
      },
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.access) {
    const rejected = res.status === 401 || res.status === 403;

    throw createAuthError(
      data?.detail || data?.error || "No se pudo renovar la sesión.",
      {
        code: rejected ? "REFRESH_TOKEN_REJECTED" : "REFRESH_REQUEST_FAILED",
        status: res.status,
        rejected,
      },
    );
  }

  /*
   * Si SimpleJWT está configurado para rotar
   * refresh tokens, usamos el nuevo.
   *
   * En caso contrario conservamos el anterior.
   */
  saveJwtTokens({
    access: data.access,
    refresh: data.refresh || refresh,
  });

  return data.access;
}

function refreshAccessToken() {
  /*
   * Todas las peticiones que reciban 401
   * compartirán la misma renovación.
   */
  if (!refreshTokenPromise) {
    refreshTokenPromise = executeRefreshAccessToken().finally(() => {
      refreshTokenPromise = null;
    });
  }

  return refreshTokenPromise;
}

async function ensureFreshAccessToken() {
  const access = getAccessToken();
  const refresh = getRefreshToken();

  /*
   * No hay sesión que renovar.
   */
  if (!access && !refresh) {
    return "";
  }

  /*
   * Si tenemos access vigente, continuamos.
   */
  if (access && !jwtExpiresSoon(access)) {
    return access;
  }

  /*
   * Si el access está vencido o próximo
   * a vencer, renovamos automáticamente.
   */
  if (refresh) {
    return refreshAccessToken();
  }

  throw createAuthError(
    "La sesión no puede renovarse porque no existe refresh token.",
    {
      code: "REFRESH_TOKEN_MISSING",
      rejected: true,
    },
  );
}

function closeExpiredSession() {
  clearFullSession();
  redirectToLogin();
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

function getWhatsAppNumbersFromSources() {
  const user = getStoredUserObject();

  if (!user) return [];

  const raw =
    user.telefono ||
    user.numero_asesor ||
    user.whatsapp_number ||
    user.phone ||
    "";

  const partes = Array.isArray(raw) ? raw : String(raw || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      partes
        .map(normalizaTelefonoMx)
        .filter((numero) => /^52\d{10}$/.test(numero)),
    ),
  ];
}

function getWhatsAppNumberFromSources(numeroPreferido = "") {
  const numeroExplicito = normalizaTelefonoMx(numeroPreferido);

  if (/^52\d{10}$/.test(numeroExplicito)) {
    return numeroExplicito;
  }

  return getWhatsAppNumbersFromSources()[0] || "";
}

function withRequestContext(payload = {}) {
  const numero = getWhatsAppNumberFromSources(payload?.numero_asesor || "");

  const usuario = String(payload?.usuario || "").trim() || getCrmUsername();

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

function appendContextToFormData(fd, numeroAsesor = "") {
  const numero = getWhatsAppNumberFromSources(numeroAsesor);

  const usuario = getCrmUsername();

  if (numero) {
    fd.append("numero_asesor", numero);
  }

  if (usuario) {
    fd.append("usuario", usuario);
  }
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
    _skipProactiveRefresh = false,
  } = {},
) {
  const refreshRequest = isRefreshEndpoint(path);

  const loginRequest = isLoginEndpoint(path);

  /*
   * Renovación preventiva:
   * se ejecuta antes de enviar la petición.
   */
  if (!_skipProactiveRefresh && !refreshRequest && !loginRequest) {
    try {
      await ensureFreshAccessToken();
    } catch (error) {
      /*
       * Solo cerramos la sesión cuando el
       * servidor confirmó que el refresh
       * ya no es válido.
       */
      if (error?.authRejected) {
        closeExpiredSession();

        throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
          code: "SESSION_EXPIRED",
          status: error?.status || 401,
          rejected: true,
          cause: error,
        });
      }

      /*
       * Un fallo de conexión no debe borrar
       * el usuario ni las conversaciones.
       */
      throw error;
    }
  }

  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  if (isFormData(body)) {
    delete finalHeaders["Content-Type"];
    delete finalHeaders["content-type"];
  }

  let res;

  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: finalHeaders,
      body,
    });
  } catch (cause) {
    throw createAuthError("No fue posible conectar con el servidor.", {
      code: "NETWORK_ERROR",
      cause,
    });
  }

  /*
   * El access pudo vencer entre la validación
   * previa y la petición. Renovamos y repetimos
   * solamente una vez.
   */
  if (res.status === 401 && _retryRefresh && !refreshRequest && !loginRequest) {
    try {
      await refreshAccessToken();
    } catch (error) {
      if (error?.authRejected) {
        closeExpiredSession();

        throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
          code: "SESSION_EXPIRED",
          status: error?.status || 401,
          rejected: true,
          cause: error,
        });
      }

      /*
       * Conservamos localStorage cuando se trata
       * de un problema temporal del servidor o red.
       */
      throw error;
    }

    return http(path, {
      method,
      body,
      headers,
      _retryRefresh: false,
      _skipProactiveRefresh: true,
    });
  }

  /*
   * Si después de renovar el access la API
   * todavía responde 401, la sesión ya no
   * es utilizable.
   */
  if (res.status === 401 && !refreshRequest && !loginRequest) {
    closeExpiredSession();

    throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
      code: "SESSION_EXPIRED",
      status: 401,
      rejected: true,
    });
  }

  if (!res.ok) {
    const message = await parseErrorResponse(res);

    throw createAuthError(message || `HTTP ${res.status}`, {
      code: "HTTP_ERROR",
      status: res.status,
    });
  }

  if (res.status === 204) {
    return null;
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

function getNumeroAsesorIA(numeroAsesor) {
  const raw = String(numeroAsesor || "").trim();

  if (!raw) {
    throw new Error("Falta seleccionar una línea de WhatsApp.");
  }

  if (["GLOBAL", "TODOS", "ALL", "*"].includes(raw.toUpperCase())) {
    throw new Error(
      "La configuración global ya no está permitida. Selecciona un número de WhatsApp.",
    );
  }

  const numero = normalizaTelefonoMx(raw);

  if (!numero) {
    throw new Error("Número de WhatsApp inválido.");
  }

  return numero;
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
  digitalesListProspectos: (params = {}) =>
    http(`/digitales/api/prospectos/${buildQuery(withRequestContext(params))}`),
  digitalesGetProspecto: (id) => http(`/digitales/api/prospectos/${id}/`),

  digitalesCreateProspecto: (payload) =>
    http("/digitales/api/prospectos/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesUpdateProspecto: (id, payload) =>
    http(`/digitales/api/prospectos/${id}/`, {
      method: "PATCH",
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

  digitalesGenerarResumen: (id) => {
    if (!id) {
      return Promise.reject(
        new Error("Falta el ID del prospecto para generar el resumen."),
      );
    }

    return http(
      `/digitales/api/prospectos/${encodeURIComponent(id)}/generar-resumen/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );
  },

  digitalesListEvidencias: (idProspecto) =>
    http(`/digitales/api/prospectos/${idProspecto}/evidencias/`),

  digitalesUploadEvidencias: (idProspecto, formData) =>
    http(`/digitales/api/prospectos/${idProspecto}/evidencias/`, {
      method: "POST",
      body: formData,
    }),

  digitalesDeleteEvidencia: (idProspecto, idEvidencia) =>
    http(
      `/digitales/api/prospectos/${idProspecto}/evidencias/${idEvidencia}/`,
      {
        method: "DELETE",
      },
    ),

  digitalesCampanasMeta: (days = 30) =>
    http(`/digitales/api/campanas-meta/?days=${encodeURIComponent(days)}`),

  // Chats WhatsApp
  digitalesChats: (params = {}) =>
    http(`/digitales/chats/${buildQuery(withRequestContext(params))}`),

  digitalesMarkRead: (tel) =>
    http("/digitales/chats/mark-read/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ tel })),
    }),

  digitalesMarkUnread: (payload = {}) =>
    http("/digitales/chats/mark-unread/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesBloquearContacto: (payload = {}) =>
    http("/digitales/chats/bloquear/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
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
  digitalesEnviarMensaje: (payload = {}) =>
    http("/digitales/mensajes/enviar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
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
    numero_asesor = "",
  }) => {
    const fd = new FormData();

    fd.append("to", String(to || "").trim());

    if (text) {
      fd.append("text", String(text));
    }

    if (reply_to_message_id) {
      fd.append("reply_to_message_id", String(reply_to_message_id));
    }

    appendContextToFormData(fd, numero_asesor);

    const arr = Array.isArray(files) ? files : Array.from(files || []);

    arr.forEach((file) => {
      if (file) fd.append("files", file);
    });

    return http("/digitales/mensajes/enviar-media/", {
      method: "POST",
      body: fd,
    });
  },
  digitalesEditarMensaje: (payload = {}) =>
    http("/digitales/mensajes/editar/", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesPlantillas: (params = {}) =>
    http(
      `/digitales/mensajes/plantillas/${buildQuery(
        withRequestContext(params),
      )}`,
    ),

  // Administración de plantillas directamente en Meta.
  digitalesPlantillasAdmin: (numeroAsesor = "") => {
    const numero = normalizaTelefonoMx(
      numeroAsesor || getWhatsAppNumberFromSources(),
    );
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/admin/${buildQuery({
        numero_asesor: numero,
        usuario,
      })}`,
    );
  },

  digitalesPlantillaCrear: (numeroAsesor, payload) => {
    const numero = normalizaTelefonoMx(
      numeroAsesor || getWhatsAppNumberFromSources(),
    );
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/admin/${buildQuery({ numero_asesor: numero, usuario })}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withRequestContext(payload || {})),
      },
    );
  },

  digitalesPlantillaAnalizar: (numeroAsesor, payload) => {
    const numero = normalizaTelefonoMx(
      numeroAsesor || getWhatsAppNumberFromSources(),
    );
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/admin/analizar/${buildQuery({ numero_asesor: numero, usuario })}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withRequestContext(payload || {})),
      },
    );
  },

  digitalesPlantillaEditar: (numeroAsesor, templateId, payload) => {
    const numero = normalizaTelefonoMx(
      numeroAsesor || getWhatsAppNumberFromSources(),
    );
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(templateId)}/${buildQuery({ numero_asesor: numero, usuario })}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withRequestContext(payload || {})),
      },
    );
  },

  digitalesPlantillaEliminar: (numeroAsesor, templateId, name) => {
    const numero = normalizaTelefonoMx(
      numeroAsesor || getWhatsAppNumberFromSources(),
    );
    const usuario = getCrmUsername();

    return http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(templateId)}/${buildQuery(
        {
          numero_asesor: numero,
          usuario,
          name,
        },
      )}`,
      { method: "DELETE" },
    );
  },

  digitalesLlamarWhatsapp: ({ telefono, sdp_offer = "" }) =>
    http("/digitales/llamar-whatsapp/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withRequestContext({ telefono, sdp_offer })),
    }),

  // Control de IA por conversación
  iaPausarConversacion: (payload = {}) =>
    http("/digitales/ia/conversacion/pausar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          ...payload,
          tel: normalizaTelefonoMx(payload?.tel),
          motivo: payload?.motivo || "manual_desde_chat",
        }),
      ),
    }),

  iaReactivarConversacion: (payload = {}) =>
    http("/digitales/ia/conversacion/reactivar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          ...payload,
          tel: normalizaTelefonoMx(payload?.tel),
        }),
      ),
    }),

  // Configuración IA
  iaLineas: () => http("/digitales/ia/lineas/"),

  iaConfigGet: (numeroAsesor) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(`/digitales/ia/config/${encodeURIComponent(numero)}/`);
  },

  iaConfigPatch: (numeroAsesor, payload) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(`/digitales/ia/config/${encodeURIComponent(numero)}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        withRequestContext({
          ...(payload || {}),
          numero_asesor: numero,
        }),
      ),
    });
  },

  iaConfigPublicar: (numeroAsesor) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(
      `/digitales/ia/config/${encodeURIComponent(numero)}/publicar/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          withRequestContext({
            numero_asesor: numero,
          }),
        ),
      },
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
  catalogoVehiculoSubirMedia: (id, tipo, files) => {
    const fd = new FormData();
    fd.append("tipo", tipo);

    const arr = Array.isArray(files) ? files : Array.from(files || []);
    arr.forEach((file) => {
      if (file) fd.append("files", file);
    });

    return http(`/digitales/catalogo/vehiculos/${id}/upload/`, {
      method: "POST",
      body: fd,
    });
  },

  catalogoVehiculoEliminarMedia: (id, tipo, ruta) =>
    http(
      `/digitales/catalogo/vehiculos/${id}/media/${buildQuery({ tipo, ruta })}`,
      { method: "DELETE" },
    ),

  // Vehículos usados (catálogo tipo WhatsApp Business)
  digitalesListAutosUsados: () => http("/digitales/catalogo/usados/"),

  digitalesGetAutoUsado: (id) =>
    http(`/digitales/catalogo/usados/${id}/`),

  digitalesCreateAutoUsado: (payload) =>
    http("/digitales/catalogo/usados/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesUpdateAutoUsado: (id, payload) =>
    http(`/digitales/catalogo/usados/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  digitalesDeleteAutoUsado: (id) =>
    http(`/digitales/catalogo/usados/${id}/`, {
      method: "DELETE",
    }),

  digitalesSubirImagenAutoUsado: (file) => {
    const fd = new FormData();
    fd.append("imagen", file);

    return http("/digitales/catalogo/usados/subir-imagen/", {
      method: "POST",
      body: fd,
    });
  },
};

export {
  http,
  normalizaTelefonoMx,
  getCrmUsername,
  getWhatsAppNumberFromSources,
};
