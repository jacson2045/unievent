import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Info, RefreshCw, Save } from "lucide-react";
import Button from "../../components/ui/Button";
import EventMap from "../../components/ui/EventMap";
import {
  createEvent,
  getCategories,
  getEventById,
  updateEvent,
} from "../../api/eventsApi";
import { HttpError } from "../../api/client";
import { getUser } from "../../utils/auth";
import type { EventCategory, EventModality, EventPayload } from "../../types/event";

interface Props {
  onNavigate: (p: string) => void;
  /** Si viene un id, el formulario edita ese evento; si no, crea uno nuevo. */
  eventId?: number | null;
}

interface FormState {
  nombre: string;
  descripcionCorta: string;
  descripcion: string;
  categoriaId: string;
  modalidad: EventModality;
  tags: string;
  lugar: string;
  direccion: string;
  organizador: string;
  fechaInicio: string; // yyyy-MM-ddTHH:mm (input datetime-local)
  fechaFin: string;
  capacidad: string;
  gratuito: boolean;
  precio: string;
  requisitos: string;
  imagenUrl: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  nombre: "",
  descripcionCorta: "",
  descripcion: "",
  categoriaId: "",
  modalidad: "PRESENCIAL",
  tags: "",
  lugar: "",
  direccion: "",
  organizador: "",
  fechaInicio: "",
  fechaFin: "",
  capacidad: "",
  gratuito: true,
  precio: "",
  requisitos: "",
  imagenUrl: "",
};

/** "2027-03-10T10:00:00" -> "2027-03-10T10:00" (formato de datetime-local). */
function toLocalInput(value: string | null): string {
  return value ? value.slice(0, 16) : "";
}

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.nombre.trim()) e.nombre = "El nombre es obligatorio";
  else if (f.nombre.length > 150) e.nombre = "Máximo 150 caracteres";
  if (f.descripcionCorta.length > 200) e.descripcionCorta = "Máximo 200 caracteres";
  if (f.descripcion.length > 500) e.descripcion = "Máximo 500 caracteres";
  if (!f.categoriaId) e.categoriaId = "Selecciona una categoría";
  if (!f.lugar.trim()) e.lugar = "El lugar es obligatorio";
  if (!f.fechaInicio) e.fechaInicio = "La fecha de inicio es obligatoria";
  else if (new Date(f.fechaInicio).getTime() <= Date.now()) e.fechaInicio = "La fecha debe ser futura";
  if (f.fechaFin && f.fechaInicio && new Date(f.fechaFin) <= new Date(f.fechaInicio))
    e.fechaFin = "Debe ser posterior al inicio";
  const cap = Number(f.capacidad);
  if (!f.capacidad || !Number.isInteger(cap) || cap <= 0) e.capacidad = "Ingresa un número entero mayor a 0";
  if (!f.gratuito) {
    const price = Number(f.precio);
    if (!f.precio || Number.isNaN(price) || price <= 0) e.precio = "Ingresa un precio mayor a 0";
  }
  if (f.imagenUrl && !/^https?:\/\//i.test(f.imagenUrl)) e.imagenUrl = "Debe empezar con http:// o https://";
  return e;
}

function toPayload(f: FormState): EventPayload {
  const opt = (v: string) => (v.trim() ? v.trim() : null);
  return {
    nombre: f.nombre.trim(),
    descripcion: opt(f.descripcion),
    descripcionCorta: opt(f.descripcionCorta),
    fecha: `${f.fechaInicio}:00`,
    fechaFin: f.fechaFin ? `${f.fechaFin}:00` : null,
    lugar: f.lugar.trim(),
    direccion: opt(f.direccion),
    capacidad: Number(f.capacidad),
    precio: f.gratuito ? 0 : Number(f.precio),
    categoriaId: Number(f.categoriaId),
    modalidad: f.modalidad,
    organizador: opt(f.organizador),
    requisitos: opt(f.requisitos),
    tags: opt(
      f.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .join(","),
    ),
    imagenUrl: opt(f.imagenUrl),
  };
}

export default function CreateEvent({ onNavigate, eventId = null }: Props) {
  const editing = eventId !== null;
  const [form, setForm] = useState<FormState>({ ...EMPTY, organizador: getUser()?.nombreCompleto ?? "" });
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [inscritos, setInscritos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  // Vista previa del mapa: se actualiza cuando el organizador deja de escribir (evita recargar el mapa en cada tecla).
  const [mapPreview, setMapPreview] = useState({ lugar: "", direccion: "" });
  useEffect(() => {
    const t = window.setTimeout(() => setMapPreview({ lugar: form.lugar, direccion: form.direccion }), 800);
    return () => window.clearTimeout(t);
  }, [form.lugar, form.direccion]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cats = await getCategories();
        if (!active) return;
        setCategories(cats);
        if (editing) {
          const ev = await getEventById(eventId!);
          if (!active) return;
          setInscritos(ev.inscritos);
          setForm({
            nombre: ev.nombre,
            descripcionCorta: ev.descripcionCorta ?? "",
            descripcion: ev.descripcion ?? "",
            categoriaId: ev.categoria ? String(ev.categoria.id) : "",
            modalidad: ev.modalidad ?? "PRESENCIAL",
            tags: (ev.tags ?? []).join(", "),
            lugar: ev.lugar,
            direccion: ev.direccion ?? "",
            organizador: ev.organizador ?? "",
            fechaInicio: toLocalInput(ev.fecha),
            fechaFin: toLocalInput(ev.fechaFin),
            capacidad: String(ev.capacidad),
            gratuito: Number(ev.precio) <= 0,
            precio: Number(ev.precio) > 0 ? String(ev.precio) : "",
            requisitos: ev.requisitos ?? "",
            imagenUrl: ev.imagenUrl ?? "",
          });
        }
      } catch (err) {
        if (active) setServerError(err instanceof Error ? err.message : "No se pudo cargar el formulario.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [editing, eventId]);

  const set =
    <K extends keyof FormState>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((p) => ({ ...p, [k]: value }));
      setErrors((p) => ({ ...p, [k]: undefined }));
    };

  const submit = async () => {
    const found = validate(form);
    if (editing && Number(form.capacidad) < inscritos) {
      found.capacidad = `No puede ser menor a los ${inscritos} inscritos actuales`;
    }
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        await updateEvent(eventId!, toPayload(form));
      } else {
        await createEvent(toPayload(form));
      }
      onNavigate("my-events");
    } catch (err) {
      setServerError(
        err instanceof HttpError && err.status === 403
          ? "No tienes permiso para modificar este evento."
          : err instanceof Error
            ? err.message
            : "No se pudo guardar el evento.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando...
      </div>
    );
  }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => onNavigate("my-events")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-2"
          >
            <ArrowLeft size={14} /> Mis eventos
          </button>
          <h2 className="text-xl font-bold font-display text-slate-900">{editing ? "Editar evento" : "Crear evento"}</h2>
          <p className="text-sm text-slate-500">
            {editing ? "Actualiza la información de tu evento." : "Completa la información para publicar tu evento."}
          </p>
        </div>
      </div>

      <Section title="Información general">
        <Field label="Nombre del evento *" error={errors.nombre}>
          <input value={form.nombre} onChange={set("nombre")} maxLength={150} placeholder="ej. Congreso de Inteligencia Artificial" className={inputCls(errors.nombre)} />
        </Field>
        <Field label="Resumen corto" error={errors.descripcionCorta} hint="Se muestra en las tarjetas del catálogo.">
          <input value={form.descripcionCorta} onChange={set("descripcionCorta")} maxLength={200} placeholder="Una línea que describa el evento" className={inputCls(errors.descripcionCorta)} />
        </Field>
        <Field label="Descripción" error={errors.descripcion} hint={`${form.descripcion.length}/500`}>
          <textarea value={form.descripcion} onChange={set("descripcion")} rows={4} maxLength={500} placeholder="Describe el evento en detalle..." className={`${inputCls(errors.descripcion)} h-auto py-2.5 resize-none`} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Categoría *" error={errors.categoriaId}>
            <select value={form.categoriaId} onChange={set("categoriaId")} className={inputCls(errors.categoriaId)}>
              <option value="">Seleccionar...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modalidad *">
            <select value={form.modalidad} onChange={set("modalidad")} className={inputCls()}>
              <option value="PRESENCIAL">Presencial</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </Field>
        </div>
        <Field label="Etiquetas" hint="Separadas por coma, por ejemplo: IA, Python, Datos">
          <input value={form.tags} onChange={set("tags")} className={inputCls()} />
        </Field>
      </Section>

      <Section title="Lugar y fecha">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Lugar *" error={errors.lugar}>
            <input value={form.lugar} onChange={set("lugar")} maxLength={150} placeholder="ej. Auditorio Central" className={inputCls(errors.lugar)} />
          </Field>
          <Field label="Organiza" hint="Nombre visible para los estudiantes (área, facultad o persona).">
            <input value={form.organizador} onChange={set("organizador")} maxLength={150} className={inputCls()} />
          </Field>
        </div>
        {form.modalidad !== "VIRTUAL" && (
          <>
            <Field
              label="Dirección (para el mapa)"
              hint="Opcional. Ej.: Carretera Central km 19.5, Ñaña, Lima. Si se deja vacía, se busca el lugar en la universidad."
            >
              <input value={form.direccion} onChange={set("direccion")} maxLength={255} placeholder="Calle, número, distrito, ciudad" className={inputCls()} />
            </Field>
            {(mapPreview.lugar.trim() || mapPreview.direccion.trim()) && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Vista previa: así verán la ubicación los estudiantes</p>
                <EventMap lugar={mapPreview.lugar} direccion={mapPreview.direccion} height={200} showActions={false} />
              </div>
            )}
          </>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Inicio *" error={errors.fechaInicio}>
            <input type="datetime-local" value={form.fechaInicio} onChange={set("fechaInicio")} className={inputCls(errors.fechaInicio)} />
          </Field>
          <Field label="Fin" error={errors.fechaFin}>
            <input type="datetime-local" value={form.fechaFin} onChange={set("fechaFin")} className={inputCls(errors.fechaFin)} />
          </Field>
        </div>
      </Section>

      <Section title="Cupos y precio">
        <Field
          label="Capacidad máxima *"
          error={errors.capacidad}
          hint={editing && inscritos > 0 ? `Actualmente hay ${inscritos} inscrito(s).` : undefined}
        >
          <input type="number" min={1} value={form.capacidad} onChange={set("capacidad")} placeholder="ej. 100" className={inputCls(errors.capacidad)} />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.gratuito} onChange={set("gratuito")} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
          <span className="text-sm text-slate-700">Evento gratuito</span>
        </label>
        {form.gratuito ? (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700">
            Las inscripciones se confirman al instante, sin pasar por Mercado Pago.
          </div>
        ) : (
          <Field label="Precio (S/) *" error={errors.precio} hint="El estudiante paga con Mercado Pago al inscribirse.">
            <input type="number" min={0.1} step={0.1} value={form.precio} onChange={set("precio")} placeholder="0.00" className={inputCls(errors.precio)} />
          </Field>
        )}
        {editing && inscritos > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-xs text-amber-700">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            Cambiar el precio no afecta a quienes ya se inscribieron.
          </div>
        )}
      </Section>

      <Section title="Detalles adicionales">
        <Field label="Requisitos">
          <input value={form.requisitos} onChange={set("requisitos")} maxLength={300} placeholder="ej. Traer laptop" className={inputCls()} />
        </Field>
        <Field label="URL de imagen" error={errors.imagenUrl} hint="Opcional. Se muestra como portada del evento.">
          <input value={form.imagenUrl} onChange={set("imagenUrl")} maxLength={500} placeholder="https://..." className={inputCls(errors.imagenUrl)} />
        </Field>
        {form.imagenUrl && !errors.imagenUrl && (
          <img src={form.imagenUrl} alt="Vista previa" className="w-full h-32 rounded-xl object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
      </Section>

      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}
      {Object.values(errors).some(Boolean) && (
        <p className="text-sm text-red-600">Revisa los campos marcados en rojo.</p>
      )}

      <div className="flex gap-3">
        <Button onClick={() => onNavigate("my-events")} variant="ghost" disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={() => void submit()} loading={saving} fullWidth icon={<Save size={16} />}>
          {editing ? "Guardar cambios" : "Publicar evento"}
        </Button>
      </div>
    </div>
  );
}

function inputCls(error?: string): string {
  return [
    "w-full h-10 px-3 rounded-xl border text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none transition-all",
    error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100",
  ].join(" ");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6 flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900 font-display">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}
