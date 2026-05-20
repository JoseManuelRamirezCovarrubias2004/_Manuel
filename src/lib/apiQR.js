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

function construirFormData(payload = {}) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });

  return formData;
}

export const apiQR = {
  info: () => http("/api/qr/info/"),

  generarPermanente: (payload) =>
    http("/api/qr/generar-permanente/", {
      method: "POST",
      body: construirFormData(payload),
    }),
};
