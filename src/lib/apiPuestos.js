// src/lib/apiPuestos.js

const API_ROOT =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const ENDPOINT_PUESTOS = `${API_ROOT.replace(/\/$/, "")}/api/rrhh/puestos/`;
const ENDPOINT_EVALUACIONES = `${API_ROOT.replace(/\/$/, "")}/api/rrhh/evaluaciones-puestos/`;

function obtenerToken() {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("auth.access") ||
    ""
  );
}

async function request(endpoint, options = {}) {
  const token = obtenerToken();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  const tieneBody = options.body !== undefined && options.body !== null;

  if (tieneBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensaje =
      data?.detail ||
      data?.error ||
      data?.message ||
      "Ocurrió un error al comunicarse con el servidor.";

    throw new Error(mensaje);
  }

  return data;
}

// ========== PUESTOS ==========

export async function listarPuestos(params = {}) {
  const query = new URLSearchParams();
  
  if (params.categoria && params.categoria !== "Todos") {
    query.append("categoria", params.categoria);
  }
  if (params.buscar) {
    query.append("buscar", params.buscar);
  }
  
  const url = `${ENDPOINT_PUESTOS}${query.toString() ? `?${query}` : ""}`;
  const data = await request(url);
  
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
}

// ========== EVALUACIONES ==========

export async function listarEvaluaciones(puestoId = null) {
  let url = ENDPOINT_EVALUACIONES;
  
  if (puestoId) {
    url = `${ENDPOINT_EVALUACIONES}?puesto_id=${puestoId}`;
  }
  
  const data = await request(url);
  return Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
}

export async function guardarEvaluacion(evaluacion) {
  const data = await request(ENDPOINT_EVALUACIONES, {
    method: "POST",
    body: JSON.stringify(evaluacion),
  });
  
  return data;
}

export default {
  listarPuestos,
  listarEvaluaciones,
  guardarEvaluacion,
};