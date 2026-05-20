//src/lib/apiAvaluos.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

function buildAvaluoFormData(payload = {}) {
  const formData = new FormData();

  const evidenciasNuevas = Array.isArray(payload.evidencias_nuevas)
    ? payload.evidencias_nuevas
    : [];

  const deleteEvidenciaIds = Array.isArray(payload.delete_evidencia_ids)
    ? payload.delete_evidencia_ids
    : [];

  const conceptos = Array.isArray(payload.conceptos) ? payload.conceptos : [];

  Object.entries(payload).forEach(([key, value]) => {
    if (
      key === "evidencias_nuevas" ||
      key === "delete_evidencia_ids" ||
      key === "conceptos"
    ) {
      return;
    }

    if (value === undefined || value === null) return;

    formData.append(key, String(value));
  });

  formData.append("conceptos_json", JSON.stringify(conceptos));

  deleteEvidenciaIds.forEach((id) => {
    if (id !== undefined && id !== null && String(id).trim() !== "") {
      formData.append("delete_evidencia_ids", String(id));
    }
  });

  evidenciasNuevas.forEach((file) => {
    if (file instanceof File || file instanceof Blob) {
      formData.append("evidencias_nuevas", file);
    }
  });

  return formData;
}

export const apiAvaluos = {
  list: () => http("/usados/api/avaluos/"),

  get: (id) => http(`/usados/api/avaluos/${id}/`),

  create: (payload) =>
    http("/usados/api/avaluos/", {
      method: "POST",
      body: buildAvaluoFormData(payload),
    }),

  update: (id, payload) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "PUT",
      body: buildAvaluoFormData(payload),
    }),

  patch: (id, payload) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "PATCH",
      body: buildAvaluoFormData(payload),
    }),

  remove: (id) =>
    http(`/usados/api/avaluos/${id}/`, {
      method: "DELETE",
    }),
};
