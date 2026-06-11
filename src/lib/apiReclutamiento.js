const API_ROOT =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const ENDPOINT = `${API_ROOT.replace(/\/$/, "")}/api/rrhh/vacantes/`;

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

function construirQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([clave, valor]) => {
    if (
      valor !== undefined &&
      valor !== null &&
      valor !== "" &&
      valor !== "Todos"
    ) {
      const nombreParametro = clave === "q" ? "buscar" : clave;
      query.append(nombreParametro, valor);
    }
  });

  const texto = query.toString();

  return texto ? `?${texto}` : "";
}

function obtenerPrimerError(data) {
  if (!data || typeof data !== "object") return "";

  const primeraClave = Object.keys(data)[0];

  if (!primeraClave) return "";

  const valor = data[primeraClave];

  if (Array.isArray(valor)) {
    return `${primeraClave}: ${valor.join(", ")}`;
  }

  if (typeof valor === "string") {
    return `${primeraClave}: ${valor}`;
  }

  if (typeof valor === "object") {
    return `${primeraClave}: ${JSON.stringify(valor)}`;
  }

  return "";
}

async function request(ruta = "", options = {}) {
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

  const response = await fetch(`${ENDPOINT}${ruta}`, {
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
      obtenerPrimerError(data) ||
      "Ocurrió un error al comunicarse con el servidor.";

    throw new Error(mensaje);
  }

  return data;
}

function normalizarLista(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function normalizarFecha(valor) {
  if (!valor) return null;

  return valor;
}

function limpiarCandidato(candidato = {}) {
  return {
    id: candidato.id || candidato.id_candidato || null,
    id_candidato: candidato.id_candidato || candidato.id || null,

    nombre: candidato.nombre || "",
    sexo: candidato.sexo || "",
    telefono: candidato.telefono || "",
    correo: candidato.correo || "",
    ubicacion: candidato.ubicacion || "",

    puesto_postulado: candidato.puesto_postulado || "",
    fuente: candidato.fuente || "",
    estatus: candidato.estatus || "Nuevo",

    // ✅ Conservamos el nombre del CV (la URL que ya tenía o el nombre del nuevo)
    cv: candidato.cv || "",

    fecha_entrevista_do: normalizarFecha(candidato.fecha_entrevista_do),
    fecha_entrevista_gerente: normalizarFecha(candidato.fecha_entrevista_gerente),
    fecha_respuesta_gerente: normalizarFecha(candidato.fecha_respuesta_gerente),
    fecha_alta_khor: normalizarFecha(candidato.fecha_alta_khor),
    fecha_realizacion_khor: normalizarFecha(candidato.fecha_realizacion_khor),
    fecha_entrega_resultados_khor: normalizarFecha(candidato.fecha_entrega_resultados_khor),
    tipo_validacion_socioeconomica: candidato.tipo_validacion_socioeconomica || "No aplica",
    fecha_solicitud_estudio_socioeconomico: normalizarFecha(candidato.fecha_solicitud_estudio_socioeconomico),
    fecha_entrega_reporte_socioeconomico: normalizarFecha(candidato.fecha_entrega_reporte_socioeconomico),
    fecha_solicitud_referencias_laborales: normalizarFecha(candidato.fecha_solicitud_referencias_laborales),
    fecha_entrega_referencias_laborales: normalizarFecha(candidato.fecha_entrega_referencias_laborales),
    fecha_solicitud_alta: normalizarFecha(candidato.fecha_solicitud_alta),
    fecha_respuesta_alta: normalizarFecha(candidato.fecha_respuesta_alta),
    fecha_ingreso: normalizarFecha(candidato.fecha_ingreso),
    comentarios: candidato.comentarios || "",

    // ✅ NUEVO: guardamos el archivo para usarlo después
    _cv_archivo: candidato.cv_archivo || null,
  };
}

function construirFormData(payload = {}) {
  const candidatos = Array.isArray(payload.candidatos)
    ? payload.candidatos.map(limpiarCandidato)
    : [];

  const form = new FormData();

  // Campos de la vacante
  form.append("estatus", payload.estatus || "Publicada");
  form.append("puesto", payload.puesto || "");
  form.append("dealer", payload.dealer || "");
  form.append("fuente_reclutamiento", payload.fuente_reclutamiento || "Base de datos");
  form.append("solicitado_por", payload.solicitado_por || "");

  // Candidatos como JSON (sin los archivos)
  const candidatosSinArchivo = candidatos.map(({ _cv_archivo, ...rest }) => rest);
  form.append("candidatos", JSON.stringify(candidatosSinArchivo));

  // Archivos PDF de cada candidato por separado
  candidatos.forEach((candidato, index) => {
    if (candidato._cv_archivo instanceof File) {
      form.append(`cv_archivo_${index}`, candidato._cv_archivo, candidato._cv_archivo.name);
    }
  });

  return form;
}

export const apiReclutamiento = {
  async listarVacantes(params = {}) {
    const data = await request(construirQuery(params));
    return normalizarLista(data);
  },

  async crearVacante(payload) {
    return request("", {
      method: "POST",
      body: construirFormData(payload),  // ✅ FormData en lugar de JSON
    });
  },

  async actualizarVacante(idVacante, payload) {
    return request(`${idVacante}/`, {
      method: "PATCH",
      body: construirFormData(payload),  // ✅ FormData en lugar de JSON
    });
  },

  async eliminarVacante(idVacante) {
    await request(`${idVacante}/`, { method: "DELETE" });
    return { ok: true };
  },
};

export default apiReclutamiento;
