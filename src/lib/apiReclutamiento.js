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

    // ✅ Campos del cronograma que faltaban
    fecha_primera_entrevista: normalizarFecha(candidato.fecha_primera_entrevista),
    fecha_segunda_entrevista: normalizarFecha(candidato.fecha_segunda_entrevista),
    fecha_prueba_khor: normalizarFecha(candidato.fecha_prueba_khor),
    estatus_linea_tiempo: candidato.estatus_linea_tiempo || "en proceso",
    motivo_descalificacion: candidato.motivo_descalificacion || "",

    comentarios: candidato.comentarios || "",
  };
}

// ✅ Construye FormData para soportar archivos (CVs)
function construirFormData(payload = {}) {
  const candidatos = Array.isArray(payload.candidatos)
    ? payload.candidatos.map(limpiarCandidato)
    : [];

  const archivos = [];
  const candidatosSinArchivo = candidatos.map((c, index) => {
    if (c.cv_archivo instanceof File) {
      archivos.push({ index, archivo: c.cv_archivo });
    }
    // Separamos el archivo del JSON
    const { cv_archivo, ...resto } = c;
    return resto;
  });

  const hayArchivos = archivos.length > 0;

  if (!hayArchivos) {
    // Sin archivos: enviar JSON normal
    return {
      esFormData: false,
      data: {
        estatus: payload.estatus || "Publicada",
        puesto: payload.puesto || "",
        dealer: payload.dealer || "",
        fuente_reclutamiento: payload.fuente_reclutamiento || "Base de datos",
        solicitado_por: payload.solicitado_por || "",
        candidatos: candidatosSinArchivo,
      },
    };
  }

  // Con archivos: usar FormData
  const formData = new FormData();
  formData.append("estatus", payload.estatus || "Publicada");
  formData.append("puesto", payload.puesto || "");
  formData.append("dealer", payload.dealer || "");
  formData.append("fuente_reclutamiento", payload.fuente_reclutamiento || "Base de datos");
  formData.append("solicitado_por", payload.solicitado_por || "");
  formData.append("candidatos", JSON.stringify(candidatosSinArchivo));

  archivos.forEach(({ index, archivo }) => {
    formData.append(`cv_archivo_${index}`, archivo);
  });

  return { esFormData: true, data: formData };
}

export const apiReclutamiento = {
  async listarVacantes(params = {}) {
    const { q, ...rest } = params || {};
    const data = await http(
      `${ENDPOINT}${buildQuery({ ...rest, buscar: q || rest.buscar })}`,
    );
    return normalizarLista(data);
  },

  async crearVacante(payload) {
    const { esFormData, data } = construirFormData(payload);
    return http(ENDPOINT, {
      method: "POST",
      body: data,
      // Si es FormData, no ponemos Content-Type (el browser lo hace solo)
      ...(esFormData ? { isFormData: true } : {}),
    });
  },

  async actualizarVacante(idVacante, payload) {
    const { esFormData, data } = construirFormData(payload);
    return http(`${ENDPOINT}${idVacante}/`, {
      method: "PATCH",
      body: data,
      ...(esFormData ? { isFormData: true } : {}),
    });
  },

  async eliminarVacante(idVacante) {
    await http(`${ENDPOINT}${idVacante}/`, { method: "DELETE" });
    return { ok: true };
  },
};