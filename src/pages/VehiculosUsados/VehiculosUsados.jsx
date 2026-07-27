// src/pages/Comercial/VehiculosUsados.jsx
import { useEffect, useState } from "react";
import { Plus, X, Upload, Car as CarIcon, Loader2, Trash2 } from "lucide-react";
import { api } from "../../lib/apiPruebas";

const BRAND_BLUE = "#131E5C";
const ESTADOS = ["Nuevo", "Usado"];

function getListItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function VehiculoModal({ open, onClose, onSaved }) {
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        precio: "",
        estado: "Usado",
        disponible: true,
    });
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setForm({ titulo: "", descripcion: "", precio: "", estado: "Usado", disponible: true });
            setFile(null);
            setPreview(null);
            setError("");
        }
    }, [open]);

    if (!open) return null;

    const handleImagen = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.titulo.trim() || !form.precio) {
            setError("Título y precio son obligatorios.");
            return;
        }

        setSaving(true);
        try {
            let imagenes = [];

            if (file) {
                const res = await api.digitalesSubirImagenAutoUsado(file);
                if (res?.url) imagenes = [res.url];
            }

            const payload = {
                titulo: form.titulo.trim(),
                resumen: form.descripcion.trim(),
                precio: Number(form.precio),
                condicion: form.estado,
                activo: form.disponible,
                imagenes,
            };

            await api.digitalesCreateAutoUsado(payload);
            onSaved();
        } catch (err) {
            console.error(err);
            setError(err?.message || "No se pudo guardar el vehículo.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold" style={{ color: BRAND_BLUE }}>
                        Nuevo Vehículo
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100" disabled={saving}>
                        <X className="h-5 w-5" style={{ color: BRAND_BLUE }} />
                    </button>
                </div>

                {error ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <label
                        className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-gray-500 hover:bg-gray-50"
                        style={{ borderColor: `${BRAND_BLUE}55` }}
                    >
                        {preview ? (
                            <img src={preview} alt="preview" className="h-full w-full rounded-lg object-cover" />
                        ) : (
                            <>
                                <Upload className="mb-2 h-6 w-6" />
                                Subir imagen
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImagen} disabled={saving} />
                    </label>

                    <input
                        required
                        placeholder="Título (ej. Jetta Trendline 2022)"
                        value={form.titulo}
                        onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                        style={{ borderColor: `${BRAND_BLUE}33` }}
                        disabled={saving}
                    />

                    <textarea
                        placeholder="Descripción"
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                        style={{ borderColor: `${BRAND_BLUE}33` }}
                        disabled={saving}
                    />

                    <div className="flex gap-3">
                        <input
                            required
                            type="number"
                            min="0"
                            placeholder="Precio"
                            value={form.precio}
                            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                            className="w-1/2 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                            style={{ borderColor: `${BRAND_BLUE}33` }}
                            disabled={saving}
                        />

                        <select
                            value={form.estado}
                            onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                            className="w-1/2 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                            style={{ borderColor: `${BRAND_BLUE}33` }}
                            disabled={saving}
                        >
                            {ESTADOS.map((e) => (
                                <option key={e} value={e}>{e}</option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.disponible}
                            onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.checked }))}
                            disabled={saving}
                        />
                        Disponible
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg border px-4 py-2 text-sm font-semibold"
                            style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            style={{ backgroundColor: BRAND_BLUE }}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            {saving ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function VehiculoCard({ vehiculo, onDelete }) {
    const imagenUrl = Array.isArray(vehiculo.imagenes) ? vehiculo.imagenes[0] : null;
    const disponible = !!vehiculo.activo;

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
            <div className="relative h-40 w-full bg-gray-100">
                {imagenUrl ? (
                    <img src={imagenUrl} alt={vehiculo.titulo} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <CarIcon className="h-10 w-10" />
                    </div>
                )}
                <span
                    className={[
                        "absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white",
                        disponible ? "bg-emerald-500" : "bg-gray-400",
                    ].join(" ")}
                >
                    {disponible ? "Disponible" : "No disponible"}
                </span>
                <button
                    onClick={() => onDelete(vehiculo.id)}
                    className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white"
                    title="Eliminar"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="p-3">
                <div className="mb-1 flex items-center justify-between">
                    <h3 className="truncate text-sm font-bold" style={{ color: BRAND_BLUE }}>
                        {vehiculo.titulo || "Sin título"}
                    </h3>
                    <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        style={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
                    >
                        {vehiculo.condicion || "—"}
                    </span>
                </div>
                <p className="mb-2 line-clamp-2 text-xs text-gray-500">
                    {vehiculo.resumen || "Sin descripción"}
                </p>
                <p className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>
                    ${Number(vehiculo.precio || 0).toLocaleString("es-MX")}
                </p>
            </div>
        </div>
    );
}

export default function VehiculosUsados() {
    const [vehiculos, setVehiculos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [error, setError] = useState("");

    const cargar = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.digitalesListAutosUsados();
            setVehiculos(getListItems(data));
        } catch (err) {
            console.error(err);
            setError(err?.message || "No se pudieron cargar los vehículos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const handleSaved = () => {
        setModalOpen(false);
        cargar();
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este vehículo del catálogo?")) return;
        try {
            await api.digitalesDeleteAutoUsado(id);
            setVehiculos((prev) => prev.filter((v) => v.id !== id));
        } catch (err) {
            console.error(err);
            alert(err?.message || "No se pudo eliminar.");
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-extrabold" style={{ color: BRAND_BLUE }}>
                        Vehículos Usados
                    </h1>
                    <p className="text-sm text-gray-500">
                        Publica y administra los vehículos usados disponibles para venta.
                    </p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Vehículo
                </button>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-10 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando vehículos...
                </div>
            ) : vehiculos.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-400">
                    Aún no hay vehículos publicados.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {vehiculos.map((v) => (
                        <VehiculoCard key={v.id} vehiculo={v} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <VehiculoModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
        </div>
    );
}