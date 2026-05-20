// src/lib/apiClickup.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const API_BASE = `${API}/api/clickup`;

function getAuthHeaders() {
  let token = null;

  const raw = localStorage.getItem("auth");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      token = parsed?.token || null;
    } catch {
      token = null;
    }
  }

  if (!token) {
    token = localStorage.getItem("auth.access");
  }

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function http(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.mensaje ||
      (typeof data === "string" ? data : null) ||
      "Ocurrió un error en la petición.";

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

function normalizeTeam(team) {
  return {
    id: Number(team.id),
    name: team.nombre ?? "",
    description: team.descripcion ?? "",
    owner: team.propietario ?? null,
    created_at: team.creado_en ?? null,
  };
}

function normalizeMember(item) {
  const u = item.usuario || {};
  return {
    id: Number(item.id),
    team: Number(item.equipo),
    role: item.rol,
    active: Boolean(item.activo),
    joined_at: item.unido_en,
    user: u,
    name:
      u.nombre_completo ||
      [u.nombre, u.apellidos].filter(Boolean).join(" ").trim() ||
      u.correo ||
      "Miembro",
    email: u.correo || "",
    user_id: Number(u.id_usuario),
  };
}

function normalizeInvite(item) {
  const u = item.usuario_invitado || {};
  return {
    id: Number(item.id),
    team: Number(item.equipo),
    email: item.correo || u.correo || "",
    role: item.rol,
    status: item.estado,
    created_at: item.creado_en,
    expires_at: item.expira_en,
    accepted_at: item.aceptado_en || null,
    invited_user: item.usuario_invitado
      ? {
          id: Number(u.id_usuario),
          name:
            u.nombre_completo ||
            [u.nombre, u.apellidos].filter(Boolean).join(" ").trim() ||
            u.correo,
          email: u.correo || "",
          username: u.usuario || "",
        }
      : null,
  };
}

function normalizeProject(project) {
  return {
    id: Number(project.id),
    team: Number(project.equipo),
    name: project.nombre ?? "",
    description: project.descripcion ?? "",
    color: project.color ?? "#64748b",
    created_at: project.creado_en ?? null,
  };
}

function normalizeList(list) {
  return {
    id: Number(list.id),
    project: Number(list.proyecto),
    name: list.nombre ?? "",
    order: Number(list.orden ?? 0),
  };
}

function normalizeEvidence(item) {
  return {
    id: Number(item.id),
    type: item.tipo,
    comment: item.comentario || "",
    file_url: item.archivo_url || "",
    created_at: item.creado_en,
    uploaded_by: item.subido_por
      ? {
          id: Number(item.subido_por.id_usuario),
          name:
            item.subido_por.nombre_completo ||
            [item.subido_por.nombre, item.subido_por.apellidos]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            item.subido_por.correo ||
            "Usuario",
          email: item.subido_por.correo || "",
        }
      : null,
  };
}

function normalizeTask(task, listsMap = {}) {
  const listId = Number(task.lista);

  return {
    id: Number(task.id),
    list: listId,
    list_id: listId,
    list_name: listsMap[listId]?.name || "",
    title: task.titulo ?? "",
    titulo: task.titulo ?? "",
    description: task.descripcion ?? "",
    priority: task.prioridad ?? "MEDIUM",
    created_at: task.creada ?? null,
    start_date: task.inicio ?? task.fecha_inicio ?? task.creada ?? null,
    due_date: task.vence ?? task.fecha_vencimiento ?? null,
    order: Number(task.orden ?? 0),
    created_by: task.creado_por ?? null,
    bug_evidencias_count: Number(task.bug_evidencias_count ?? 0),
    resolution_evidencias_count: Number(task.resolution_evidencias_count ?? 0),

    // EXTRAER CAMPOS DEL PLAN DE ACCIÓN DESDE EL BACKEND:
    descripcion_problema: task.descripcion_problema ?? "",
    causa: task.causa ?? "",
    raiz: task.raiz ?? "",
    desarrollo_estrategia: task.desarrollo_estrategia ?? "",
    resultados: task.resultados ?? "",

    // NORMALIZAR LISTA DE SUBTAREAS:
    subtareas: Array.isArray(task.subtareas)
      ? task.subtareas.map((s) => ({
          id: s.id,
          titulo: s.titulo ?? "",
          done: Boolean(s.done ?? s.completado ?? false), // Mapeo seguro por si cambia el booleano
        }))
      : [],

    report: task.reporte
      ? {
          id: Number(task.reporte.id),
          type: task.reporte.tipo,
          title: task.reporte.titulo,
          description: task.reporte.descripcion,
          status: task.reporte.estado,
          created_at: task.reporte.creado_en,
          updated_at: task.reporte.actualizado_en,
          resolved_at: task.reporte.resuelto_en,
        }
      : null,
    assigned: Array.isArray(task.asignados)
      ? task.asignados.map((a) => ({
          id: Number(a.id),
          user_id: Number(a.usuario?.id_usuario),
          name:
            a.usuario?.nombre_completo ||
            [a.usuario?.nombre, a.usuario?.apellidos]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            a.usuario?.correo ||
            "Usuario",
          email: a.usuario?.correo || "",
          username: a.usuario?.usuario || "",
        }))
      : [],
  };
}

function normalizeUser(user) {
  return {
    id: Number(user.id_usuario),
    name:
      user.nombre_completo ||
      [user.nombre, user.apellidos].filter(Boolean).join(" ").trim() ||
      user.correo ||
      "Usuario",
    email: user.correo || "",
    username: user.usuario || "",
    agencia: user.agencia || "",
  };
}

function normalizeNotification(item) {
  return {
    id: Number(item.id),
    type: item.tipo,
    title: item.titulo || "",
    message: item.mensaje || "",
    status: item.estado,
    created_at: item.creado_en,
    read_at: item.leido_en,
    team_id: item.equipo ? Number(item.equipo) : null,
    team_name: item.equipo_nombre || "",
    project_id: item.proyecto ? Number(item.proyecto) : null,
    project_name: item.proyecto_nombre || "",
    task_id: item.tarea ? Number(item.tarea) : null,
    task_title: item.tarea_titulo || "",
    invitation_id: item.invitacion ? Number(item.invitacion) : null,
  };
}

export const apiClickup = {
  async listTeams() {
    const data = await http(`${API_BASE}/equipos/`);
    return Array.isArray(data) ? data.map(normalizeTeam) : [];
  },

  async createTeam(payload) {
    const body = {
      nombre: String(payload?.name || "").trim(),
      descripcion: String(payload?.description || "").trim(),
    };

    const data = await http(`${API_BASE}/equipos/`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return normalizeTeam(data);
  },

  async listProjects(teamId) {
    const data = await http(`${API_BASE}/equipos/${Number(teamId)}/proyectos/`);
    return Array.isArray(data) ? data.map(normalizeProject) : [];
  },

  async createProject(teamId, payload) {
    const body = {
      nombre: String(payload?.name || "").trim(),
      descripcion: String(payload?.description || "").trim(),
      color: payload?.color || null,
    };

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    return normalizeProject(data);
  },

  async bootstrapProject(teamId, projectId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/bootstrap/`,
      { method: "POST" },
    );

    return Array.isArray(data) ? data.map(normalizeList) : [];
  },

  async listMembers(teamId) {
    const data = await http(`${API_BASE}/equipos/${Number(teamId)}/miembros/`);
    return Array.isArray(data) ? data.map(normalizeMember) : [];
  },

  async listInvites(teamId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/invitaciones/`,
    );
    return Array.isArray(data) ? data.map(normalizeInvite) : [];
  },

  async searchUsers(q, limit = 10) {
    const data = await http(
      `${API_BASE}/usuarios/buscar/?q=${encodeURIComponent(q || "")}&limit=${Number(limit)}`,
    );
    return Array.isArray(data) ? data.map(normalizeUser) : [];
  },

  async invite(teamId, payload) {
    const body = {
      usuario_id: Number(payload?.usuario_id),
      rol: String(payload?.rol || "MEMBER")
        .trim()
        .toUpperCase(),
    };

    return await http(`${API_BASE}/equipos/${Number(teamId)}/invitar/`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async acceptInvite(invitationId) {
    return await http(`${API_BASE}/equipos/aceptar/`, {
      method: "POST",
      body: JSON.stringify({ invitacion_id: Number(invitationId) }),
    });
  },

  async rejectInvite(invitationId) {
    return await http(`${API_BASE}/equipos/rechazar/`, {
      method: "POST",
      body: JSON.stringify({ invitacion_id: Number(invitationId) }),
    });
  },

  async getBoard(teamId, projectId) {
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/?proyecto_id=${Number(projectId)}`,
    );

    const lists = Array.isArray(data?.listas)
      ? data.listas.map(normalizeList)
      : [];
    const listsMap = Object.fromEntries(lists.map((l) => [l.id, l]));

    const rawTasksByList = data?.tareas_por_lista || {};
    const tasks_by_list = {};

    for (const [listId, tasks] of Object.entries(rawTasksByList)) {
      tasks_by_list[Number(listId)] = Array.isArray(tasks)
        ? tasks.map((task) => normalizeTask(task, listsMap))
        : [];
    }

    return {
      project: data?.proyecto ? normalizeProject(data.proyecto) : null,
      lists,
      tasks_by_list,
    };
  },

  async moveTask(teamId, payload) {
    const body = {
      tarea_id: Number(payload.task_id),
      lista_destino_id: Number(payload.to_list_id),
      orden_destino: Number(payload.to_order ?? 0),
    };

    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/mover-tarea/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  async createTask(teamId, payload) {
    const body = {
      lista: Number(payload.lista),
      titulo: String(payload.titulo || "").trim(),
      descripcion: String(payload.descripcion || "").trim(),
      prioridad: String(payload.prioridad || "MEDIUM")
        .trim()
        .toUpperCase(),
      vence: payload.vence || null,
      asignados_ids: Array.isArray(payload.asignados_ids)
        ? payload.asignados_ids.map(Number)
        : [],

      // CAMPOS EXTENDIDOS DEL PLAN DE ACCIÓN REQUERIDOS POR TU BACKEND:
      descripcion_problema: payload.descripcion_problema || "",
      causa: payload.causa || "",
      raiz: payload.raiz || "",
      desarrollo_estrategia: payload.desarrollo_estrategia || "",
      resultados: payload.resultados || "",
      subtareas: Array.isArray(payload.subtareas) ? payload.subtareas : [],
    };

    if ("inicio" in payload) {
      body.inicio = payload.inicio || null;
    }

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/crear-tarea/`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    return normalizeTask(data);
  },

  async updateTask(teamId, taskId, payload) {
    const body = {};

    if ("titulo" in payload) body.titulo = String(payload.titulo || "").trim();
    if ("descripcion" in payload)
      body.descripcion = String(payload.descripcion || "").trim();
    if ("prioridad" in payload)
      body.prioridad = String(payload.prioridad || "MEDIUM")
        .trim()
        .toUpperCase();
    if ("vence" in payload) body.vence = payload.vence || null;
    if ("inicio" in payload) body.inicio = payload.inicio || null;
    if ("lista" in payload) body.lista = Number(payload.lista);
    if ("asignados_ids" in payload) {
      body.asignados_ids = Array.isArray(payload.asignados_ids)
        ? payload.asignados_ids.map(Number)
        : [];
    }

    // CAMPOS EXTENDIDOS BLINDADOS PARA EL PATCH:
    if ("descripcion_problema" in payload)
      body.descripcion_problema = payload.descripcion_problema ?? "";
    if ("causa" in payload) body.causa = payload.causa ?? "";
    if ("raiz" in payload) body.raiz = payload.raiz ?? "";
    if ("desarrollo_estrategia" in payload)
      body.desarrollo_estrategia = payload.desarrollo_estrategia ?? "";
    if ("resultados" in payload) body.resultados = payload.resultados ?? "";
    if ("subtareas" in payload) {
      body.subtareas = Array.isArray(payload.subtareas)
        ? payload.subtareas
        : [];
    }

    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );

    return normalizeTask(data);
  },

  async deleteTask(teamId, taskId) {
    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/eliminar_tarea/`,
      { method: "DELETE" },
    );
  },

  async uploadTaskEvidence(teamId, taskId, payload) {
    const formData = new FormData();
    formData.append("tipo", payload?.tipo || "BUG");
    formData.append("comentario", payload?.comentario || "");

    (payload?.archivos || []).forEach((file) => {
      formData.append("archivos", file);
    });

    // acción del backend: 'subir_evidencia'
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/tablero/tareas/${Number(taskId)}/subir_evidencia/`,
      {
        method: "POST",
        body: formData,
      },
    );

    return Array.isArray(data) ? data.map(normalizeEvidence) : [];
  },

  async createReport(payload) {
    const formData = new FormData();
    formData.append(
      "tipo",
      String(payload?.tipo || "BUG")
        .trim()
        .toUpperCase(),
    );
    formData.append("titulo", String(payload?.titulo || "").trim());
    formData.append("descripcion", String(payload?.descripcion || "").trim());

    (payload?.imagenes || []).forEach((file) => {
      formData.append("imagenes", file);
    });

    return await http(`${API_BASE}/reportes/`, {
      method: "POST",
      body: formData,
    });
  },

  async listNotifications() {
    const data = await http(`${API_BASE}/notificaciones/`);
    return Array.isArray(data) ? data.map(normalizeNotification) : [];
  },

  async dismissNotification(notificationId) {
    return await http(
      `${API_BASE}/notificaciones/${Number(notificationId)}/descartar/`,
      {
        method: "POST",
      },
    );
  },

  async readNotification(notificationId) {
    return await http(
      `${API_BASE}/notificaciones/${Number(notificationId)}/leer/`,
      {
        method: "POST",
      },
    );
  },

  async updateProject(teamId, projectId, payload) {
    const body = {
      nombre: String(payload?.name || "").trim(),
      descripcion: String(payload?.description || "").trim(),
    };
    const data = await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    return normalizeProject(data);
  },

  async deleteTeam(teamId) {
    return await http(`${API_BASE}/equipos/${Number(teamId)}/`, {
      method: "DELETE",
    });
  },

  async deleteProject(teamId, projectId) {
    return await http(
      `${API_BASE}/equipos/${Number(teamId)}/proyectos/${Number(projectId)}/`,
      { method: "DELETE" },
    );
  },
};
