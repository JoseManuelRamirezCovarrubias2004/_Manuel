export const LINEAS_WHATSAPP = {
  522712638803: {
    asesor_digital: "IA Vagen",
    agencia: "VW Cordoba",
    etiqueta: "Córdoba IA",
  },
  522721111244: {
    asesor_digital: "Lizbeth Cano Clara",
    agencia: "VW Orizaba",
    etiqueta: "VW Orizaba",
  },
  522713133332: {
    asesor_digital: "Erendira Santos Coyotzi",
    agencia: "VW Cordoba",
    etiqueta: "VW Córdoba",
  },
  522871232641: {
    asesor_digital: "Marelly Tenorio Salinas",
    agencia: "VW Tuxtepec",
    etiqueta: "VW Tuxtepec",
  },
  527831263814: {
    asesor_digital: "Edgar Omar Noguera Solis",
    agencia: "VW Tuxpan",
    etiqueta: "VW Tuxpan",
  },
  527821820706: {
    asesor_digital: "Dulce Abigail Garcia Olivares",
    agencia: "VW Poza Rica",
    etiqueta: "VW Poza Rica",
  },
  522712837999: {
    asesor_digital: "Bianca Chavez Alarcon",
    agencia: "VW Cordoba Usados",
    etiqueta: "Córdoba Usados",
  },
  522721986539: {
    asesor_digital: "Candy Denisse Marquez",
    agencia: "VW Orizaba Usados",
    etiqueta: "Orizaba Usados",
  },
};

export function normalizarNumeroWhatsApp(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("521") && digits.length === 13) {
    return `52${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  return digits;
}

export function obtenerNumerosWhatsAppUsuario(user) {
  const raw =
    user?.telefonos_whatsapp ??
    user?.telefonos ??
    user?.telefono ??
    user?.numero_asesor ??
    user?.whatsapp_number ??
    "";

  const valores = Array.isArray(raw)
    ? raw
    : String(raw || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      valores
        .map(normalizarNumeroWhatsApp)
        .filter((numero) => /^52\d{10}$/.test(numero)),
    ),
  ];
}

export function obtenerContextoLinea(numero) {
  const normalizado = normalizarNumeroWhatsApp(numero);
  return LINEAS_WHATSAPP[normalizado] || null;
}

export function obtenerEtiquetaLinea(numero) {
  const normalizado = normalizarNumeroWhatsApp(numero);
  const contexto = LINEAS_WHATSAPP[normalizado];

  return contexto?.etiqueta || contexto?.agencia || normalizado;
}
