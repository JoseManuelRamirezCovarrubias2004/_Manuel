// src/lib/apiServicio.js
import { http } from "./apiClient";

export const apiServicio = {
  list: () => http("/api/encuestas/servicio/"),
  get: (id) => http(`/api/encuestas/servicio/${id}/`),
};
