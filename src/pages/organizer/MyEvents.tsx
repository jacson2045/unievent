import React, { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Pencil, Plus, RefreshCw, Trash2, Users, Ban, Eye } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { cancelEvent, deleteEvent, getMyEvents } from "../../api/eventsApi";
import { formatDateTime, formatMoney } from "../../utils/status";
import type { BackendEvent } from "../../types/event";

interface Props {
  onNavigate: (p: string) => void;
  onEdit: (eventId: number) => void;
  onViewParticipants: (eventId: number) => void;
  onViewEvent: (eventId: number) => void;
}

type Filter = "all" | "upcoming" | "past" | "cancelled";

export function eventStatus(ev: BackendEvent): { label: string; variant: "active" | "pending" | "cancelled" | "inactive" } {
  if (ev.estado === "CANCELADO") return { label: "Cancelado", variant: "cancelled" };
  if (new Date(ev.fecha).getTime() < Date.now()) return { label: "Finalizado", variant: "inactive" };
  if (ev.cuposDisponibles <= 0) return { label: "Agotado", variant: "pending" };
  return { label: "Publicado", variant: "active" };
}

export default function MyEvents({ onNavigate, onEdit, onViewParticipants, onViewEvent }: Props) {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setEvents(await getMyEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const now = Date.now();
    return events.filter((ev) => {
      const past = new Date(ev.fecha).getTime() < now;
      if (filter === "cancelled") return ev.estado === "CANCELADO";
      if (filter === "past") return ev.estado !== "CANCELADO" && past;
      if (filter === "upcoming") return ev.estado !== "CANCELADO" && !past;
      return true;
    });
  }, [events, filter]);

  const doCancel = async (ev: BackendEvent) => {
    if (!window.confirm(`¿Cancelar «${ev.nombre}»? Dejará de aceptar inscripciones.`)) return;
    setBusyId(ev.id);
    setError("");
    try {
      await cancelEvent(ev.id);
      setNotice(`«${ev.nombre}» fue cancelado.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el evento.");
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (ev: BackendEvent) => {
    if (!window.confirm(`¿Eliminar «${ev.nombre}» definitivamente? Esta acción no se puede deshacer.`)) return;
    setBusyId(ev.id);
    setError("");
    try {
      await deleteEvent(ev.id);
      setNotice(`«${ev.nombre}» fue eliminado.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el evento.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Mis eventos</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Cargando..." : `${events.length} evento${events.length === 1 ? "" : "s"} creados por ti`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void load()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
            Actualizar
          </Button>
          <Button onClick={() => onNavigate("create-event")} size="sm" icon={<Plus size={14} />}>
            Crear evento
          </Button>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: "all" as const, label: "Todos" },
          { id: "upcoming" as const, label: "Próximos" },
          { id: "past" as const, label: "Finalizados" },
          { id: "cancelled" as const, label: "Cancelados" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 h-8 rounded-lg text-sm font-medium transition-colors ${
              filter === t.id ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-green-600">×</button>
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Aún no has creado eventos</h3>
          <p className="text-sm text-slate-400 mb-4">Publica tu primer evento para empezar a recibir inscripciones.</p>
          <Button onClick={() => onNavigate("create-event")} size="sm" icon={<Plus size={14} />}>
            Crear evento
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No hay eventos en esta categoría.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((ev) => {
            const st = eventStatus(ev);
            const occupancy = ev.capacidad > 0 ? Math.round((ev.inscritos / ev.capacidad) * 100) : 0;
            const editable = ev.estado !== "CANCELADO";
            return (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={st.variant} dot>
                      {st.label}
                    </Badge>
                    <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-lg">
                      {ev.categoria?.nombre ?? "Sin categoría"}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{formatMoney(ev.precio)}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate">{ev.nombre}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {formatDateTime(ev.fecha)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {ev.lugar}
                    </span>
                  </div>
                </div>

                <div className="md:w-44">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {ev.inscritos} / {ev.capacidad}
                    </span>
                    <span>{occupancy}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${occupancy >= 90 ? "bg-red-500" : occupancy >= 70 ? "bg-amber-500" : "bg-primary-500"}`}
                      style={{ width: `${Math.min(100, occupancy)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  <IconButton title="Ver participantes" onClick={() => onViewParticipants(ev.id)}>
                    <Users size={15} />
                  </IconButton>
                  <IconButton title="Ver como estudiante" onClick={() => onViewEvent(ev.id)}>
                    <Eye size={15} />
                  </IconButton>
                  {editable && (
                    <IconButton title="Editar" onClick={() => onEdit(ev.id)}>
                      <Pencil size={15} />
                    </IconButton>
                  )}
                  {editable && (
                    <IconButton title="Cancelar evento" onClick={() => void doCancel(ev)} disabled={busyId === ev.id} danger>
                      <Ban size={15} />
                    </IconButton>
                  )}
                  {ev.inscritos === 0 && (
                    <IconButton title="Eliminar" onClick={() => void doDelete(ev)} disabled={busyId === ev.id} danger>
                      <Trash2 size={15} />
                    </IconButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
  disabled,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
        danger ? "text-slate-500 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}
