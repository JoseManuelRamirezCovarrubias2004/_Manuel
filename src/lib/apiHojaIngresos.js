// src/lib/apiHojaIngresos.js
import { buildQuery, http } from "./apiClient";

export const apiHojaIngresos = {
  list: (params = {}) =>
    http(`/hojaingresos/api/hoja-ingresos/${buildQuery(params)}`),

  get: (id) => http(`/hojaingresos/api/hoja-ingresos/${id}/`),

  create: (payload) =>
    http("/hojaingresos/api/hoja-ingresos/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/hojaingresos/api/hoja-ingresos/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/hojaingresos/api/hoja-ingresos/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/hojaingresos/api/hoja-ingresos/${id}/`, {
      method: "DELETE",
    }),
};
