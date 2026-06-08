// src/lib/apiLong.js
import { http } from "./apiClient";

export const apiLong = {
  list: () => http("/financieros/api/long-drives/"),

  get: (id) => http(`/financieros/api/long-drives/${id}/`),

  create: (payload) =>
    http("/financieros/api/long-drives/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/long-drives/${id}/`, {
      method: "DELETE",
    }),
};
