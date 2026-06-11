// src/lib/apiEntregas.js
import { http } from "./apiClient";

export const apiEntregas = {
  list: () => http("/citas/api/entregas/"),
  get: (id) => http(`/citas/api/entregas/${id}/`),

  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) => http(`/citas/api/entregas/${id}/`, { method: "DELETE" }),
};
