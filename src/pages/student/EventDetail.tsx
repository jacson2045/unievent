import React, { useEffect, useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  ArrowLeft,
  Share2,
  CheckCircle,
  RefreshCw,
  Building2,
  ClipboardList,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { getEventById } from "../../api/eventsApi";
import { MODALITY_LABELS, type BackendEvent } from "../../types/event";

interface Props {
  onNavigate: (page: string) => void;
  eventId: number | null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function EventDetail({ onNavigate, eventId }: Props) {
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      if (eventId === null) {
        setEvent(null);
        setError("Selecciona un evento desde el catálogo para ver sus detalles.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getEventById(eventId);
        if (active) setEvent(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el evento."
          );
          setEvent(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadEvent();
    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="max-w-5xl bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        <p className="text-slate-600">Cargando detalles del evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-5xl bg-white rounded-2xl border border-slate-100 p-8 text-center">
        <p className="font-semibold text-slate-900 mb-2">No se pudo mostrar el evento</p>
        <p className="text-sm text-slate-500 mb-5">
          {error || "El evento solicitado no existe."}
        </p>
        <Button onClick={() => onNavigate("explore-events")} icon={<ArrowLeft size={16} />}>
          Volver a eventos
        </Button>
      </div>
    );
  }

  const available = Math.max(0, event.cuposDisponibles);
  const soldOut = available <= 0;
  const occupancy = event.capacidad > 0
    ? Math.min(100, Math.round((event.inscritos / event.capacidad) * 100))
    : 0;
  const isFree = Number(event.precio) <= 0;
  const isActive = event.estado === "ACTIVO";
  const canEnroll = isActive && !soldOut;
  const dateRange = event.fechaFin
    ? `${formatDate(event.fecha)} — ${formatDate(event.fechaFin)}`
    : formatDate(event.fecha);

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("explore-events")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Volver a eventos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="relative min-h-64 md:min-h-80 bg-gradient-to-br from-primary-700 to-violet-800 rounded-2xl overflow-hidden flex items-end">
            {event.imagenUrl && (
              <img
                src={event.imagenUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="relative p-6 md:p-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {!isActive ? (
                  <Badge variant="rejected">{event.estado}</Badge>
                ) : soldOut ? (
                  <Badge variant="rejected">Agotado</Badge>
                ) : (
                  <Badge variant="active">Inscripciones abiertas</Badge>
                )}
                <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {event.categoria?.nombre || "Sin categoría"}
                </span>
                {event.modalidad && (
                  <span className="bg-white/90 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {MODALITY_LABELS[event.modalidad]}
                  </span>
                )}
              </div>
              <h1 className="text-white font-bold text-xl md:text-3xl font-display leading-tight">
                {event.nombre}
              </h1>
              {event.organizador && (
                <p className="text-white/80 text-sm mt-2">Organiza: {event.organizador}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <h2 className="font-bold text-slate-900 font-display mb-3">Sobre este evento</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-5 whitespace-pre-line">
              {event.descripcion || "Este evento todavía no tiene una descripción."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Calendar size={16} />,
                  label: "Fecha y hora",
                  value: dateRange,
                },
                {
                  icon: <MapPin size={16} />,
                  label: "Lugar",
                  value: event.lugar || "Por confirmar",
                },
                {
                  icon: <Users size={16} />,
                  label: "Capacidad total",
                  value: `${event.capacidad} personas`,
                },
                {
                  icon: <Building2 size={16} />,
                  label: "Organizador",
                  value: event.organizador || "No especificado",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                    <p className="text-sm text-slate-800 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {event.requisitos && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-1">
                  <ClipboardList size={14} /> Requisitos
                </p>
                <p className="text-sm text-amber-900">{event.requisitos}</p>
              </div>
            )}

            {event.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full"
                  >
                    <Tag size={12} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <h2 className="font-bold text-slate-900 font-display mb-3">Ubicación</h2>
            <div className="min-h-32 bg-slate-100 rounded-xl flex items-center justify-center p-5">
              <div className="text-center">
                <MapPin size={28} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-700 font-medium">{event.lugar || "Lugar por confirmar"}</p>
                <p className="text-xs text-slate-400 mt-1">Ubicación indicada por el organizador</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] sticky top-4">
            <div className="mb-4">
              {isFree ? (
                <>
                  <p className="text-3xl font-bold text-green-600 font-display">Gratuito</p>
                  <p className="text-xs text-slate-400">Sin costo de inscripción</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary-700 font-display">
                    S/ {Number(event.precio).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">Precio por persona</p>
                </>
              )}
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">Cupos disponibles</span>
                <span>
                  {available} de {event.capacidad}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${occupancy >= 90 ? "bg-red-500" : occupancy >= 70 ? "bg-amber-500" : "bg-primary-500"}`}
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {event.inscritos} inscrito{event.inscritos !== 1 ? "s" : ""} · {occupancy}% ocupado
              </p>
            </div>

            <Button
              onClick={() => onNavigate("enrollment-flow")}
              fullWidth
              size="lg"
              className="mb-3"
              disabled={!canEnroll}
            >
              {!isActive
                ? "Inscripciones cerradas"
                : soldOut
                  ? "Sin cupos disponibles"
                  : isFree
                    ? "Inscribirme gratis"
                    : "Inscribirme y pagar"}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                icon={<Share2 size={15} />}
                onClick={() => {
                  if (navigator.share) {
                    void navigator.share({
                      title: event.nombre,
                      text: event.descripcionCorta ?? event.descripcion ?? undefined,
                    }).catch(() => undefined);
                  } else if (navigator.clipboard) {
                    void navigator.clipboard.writeText(
                      `${event.nombre} - ${event.lugar}`
                    );
                  }
                }}
              >
                Compartir
              </Button>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2">
              {[
                "Evento publicado en el sistema",
                "Información proporcionada por el organizador",
                `Código de evento: ${event.id}`,
              ].map((text) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle size={14} className="text-green-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}