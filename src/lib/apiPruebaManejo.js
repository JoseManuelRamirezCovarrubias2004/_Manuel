// src/lib/apiPruebaManejo.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

export const apiPruebaManejo = {
  list: () => http("/citas/api/pruebas-manejo/"),
  get: (id) => http(`/citas/api/pruebas-manejo/${id}/`),

  create: (payload) =>
    http("/citas/api/pruebas-manejo/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  patch: (id, payload) =>
    http(`/citas/api/pruebas-manejo/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    http(`/citas/api/pruebas-manejo/${id}/`, { method: "DELETE" }),
};

// ✅ Evidencias (multipart)
export const apiEvidenciasPruebaManejo = {
  list: () => http("/citas/api/evidencias-pruebas/"),
  remove: (id) =>
    http(`/citas/api/evidencias-pruebas/${id}/`, { method: "DELETE" }),

  // crea evidencia: requiere prueba_manejo y archivo (multipart)
  create: ({ id_prueba_manejo, archivo }) => {
    const fd = new FormData();
    fd.append("prueba_manejo", String(id_prueba_manejo));
    fd.append("archivo", archivo);

    return http("/citas/api/evidencias-pruebas/", {
      method: "POST",
      body: fd,
      // OJO: NO setear Content-Type; el navegador lo pone con boundary
    });
  },
};
