import { useEffect, useMemo, useState } from "react";
import {
    BrainCircuit,
    Download,
    ImagePlus,
    Info,
    Link2,
    Loader2,
    Palette,
    RefreshCw,
    Save,
    X,
} from "lucide-react";
import { apiQR } from "../../lib/apiQR";

const ESTADO_INICIAL = {
    url: "",
    nombre_archivo: "qr-encuesta",
    formato: "png",
    escala: 8,
    borde: 4,
    error: "h",
    dark: "#131E5C",
    light: "#FFFFFF",
    finder_dark: "",
    finder_light: "",
    data_dark: "",
    data_light: "",
    alignment_dark: "",
    alignment_light: "",
    quiet_zone: "",
    logo_size: 20,
    fondo_opacidad: 170,
    logo: null,
    background: null,
    usar_colores_avanzados: false,
};

function Campo({ titulo, children, ayuda }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-bold text-[#131E5C]">{titulo}</div>
            {children}
            {ayuda ? <div className="mt-2 text-xs text-slate-500">{ayuda}</div> : null}
        </div>
    );
}

export default function GeneradorQR() {
    const [form, setForm] = useState(ESTADO_INICIAL);
    const [info, setInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [resultado, setResultado] = useState(null);

    const urlValida = useMemo(() => {
        return /^https?:\/\/.+/i.test(String(form.url || "").trim());
    }, [form.url]);

    const formatoFinal = useMemo(() => {
        if (form.logo || form.background) return "png";
        return form.formato;
    }, [form.formato, form.logo, form.background]);

    useEffect(() => {
        let cancelado = false;

        async function cargarInfo() {
            setLoadingInfo(true);
            try {
                const data = await apiQR.info();
                if (!cancelado) setInfo(data);
            } catch (e) {
                if (!cancelado) setError("No se pudo cargar la configuración del módulo.");
            } finally {
                if (!cancelado) setLoadingInfo(false);
            }
        }

        cargarInfo();
        return () => {
            cancelado = true;
        };
    }, []);

    function setCampo(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function limpiar() {
        setForm(ESTADO_INICIAL);
        setResultado(null);
        setError("");
    }

    function construirPayload() {
        return {
            url: String(form.url || "").trim(),
            nombre_archivo: String(form.nombre_archivo || "").trim() || "qr",
            formato: formatoFinal,
            escala: String(form.escala),
            borde: String(form.borde),
            error: form.error,
            dark: form.dark,
            light: form.light,
            finder_dark: form.usar_colores_avanzados ? form.finder_dark : "",
            finder_light: form.usar_colores_avanzados ? form.finder_light : "",
            data_dark: form.usar_colores_avanzados ? form.data_dark : "",
            data_light: form.usar_colores_avanzados ? form.data_light : "",
            alignment_dark: form.usar_colores_avanzados ? form.alignment_dark : "",
            alignment_light: form.usar_colores_avanzados ? form.alignment_light : "",
            quiet_zone: form.usar_colores_avanzados ? form.quiet_zone : "",
            logo_size: String(form.logo_size),
            fondo_opacidad: String(form.fondo_opacidad),
            logo: form.logo,
            background: form.background,
        };
    }

    async function generar() {
        if (!urlValida || saving) return;

        setSaving(true);
        setError("");

        try {
            const data = await apiQR.generarPermanente(construirPayload());
            setResultado(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "No se pudo generar el QR.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <span>
                    </span>
                    <h2 className="text-lg font-extrabold text-[#131E5C]"><BrainCircuit />Configuracion de  IA</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Configura el Prompt de la IA.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={generar}
                        disabled={!urlValida || saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Generar y guardar
                    </button>

                    <button
                        onClick={limpiar}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Limpiar
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4">
                <div className="xl:col-span-7">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Campo titulo="Link" ayuda="Debe iniciar con http:// o https://">
                                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
                                    <Link2 className="h-4 w-4 text-[#131E5C]" />
                                    <input
                                        value={form.url}
                                        onChange={(e) => setCampo("url", e.target.value)}
                                        placeholder="https://midominio.com/encuesta/123"
                                        className="w-full text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </div>
                            </Campo>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}