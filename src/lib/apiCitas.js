// src/lib/apiCitas.js
import { http } from "./apiClient";

export const apiCitas = {
  list: () => http("/citas/api/citas/"),
  get: (id) => http(`/citas/api/citas/${id}/`),

  create: (payload) =>
    http("/citas/api/citas/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) => http(`/citas/api/citas/${id}/`, { method: "DELETE" }),
};
