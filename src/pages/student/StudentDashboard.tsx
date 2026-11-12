import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CreditCard, CheckSquare, ArrowRight, Clock, MapPin, Users, RefreshCw } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getMyEnrollmentsWithEvents, type EnrollmentWithEvent } from "../../api/enrollmentApi";
import { getEvents } from "../../api/eventsApi";
import { getUser } from "../../utils/auth";
import { ENROLLMENT_STATUS, formatDateTime, formatMoney } from "../../utils/status";
import type { BackendEvent } from "../../types/event";

interface Props {
  onNavigate: (p: string) => void;
  onSelectEvent: (eventId: number) => void;
}

function isFuture(value: string): boolean {
  return new Date(value).getTime() > Date.now();
}

export default function StudentDashboard({ onNavigate, onSelectEvent }: Props) {
  const user = getUser();
  const [enrollments, setEnrollments] = useState<EnrollmentWithEvent[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, all] = await Promise.all([getMyEnrollmentsWithEvents(), getEvents()]);
      setEnrollments(mine);
      setEvents(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar tu información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const confirmed = enrollments.filter((e) => e.enrollment.estado === "CONFIRMADA");
    const pending = enrollments.filter((e) => e.enrollment.estado === "PENDIENTE");
    const approved = enrollments.filter((e) => e.enrollment.pagoEstado === "APPROVED");
    const paidTotal = approved.reduce((sum, e) => sum + Number(e.enrollment.pagoMonto ?? 0), 0);
    const next = confirmed
      .filter((e) => e.event && isFuture(e.event.fecha))
      .sort((a, b) => new Date(a.event!.fecha).getTime() - new Date(b.event!.fecha).getTime())[0];
    return { confirmed, pending, approved, paidTotal, next };
  }, [enrollments]);

  // Inscripciones vigentes de eventos que aún no ocurren, la más próxima primero.
  const active = useMemo(
    () =>
      enrollments
        .filter((e) => e.enrollment.estado !== "CANCELADA" && e.event && isFuture(e.event.fecha))
        .sort((a, b) => new Date(a.event!.fecha).getTime() - new Date(b.event!.fecha).getTime())
        .slice(0, 5),
    [enrollments],
  );

  // Eventos próximos en los que el estudiante todavía no está inscrito.
  const suggestions = useMemo(() => {
    const enrolledIds = new Set(
      enrollments.filter((e) => e.enrollment.estado !== "CANCELADA").map((e) => e.enrollment.eventoId),
    );
    return events
      .filter((ev) => ev.estado === "ACTIVO" && isFuture(ev.fecha) && !enrolledIds.has(ev.id) && ev.cuposDisponibles > 0)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 3);
  }, [events, enrollments]);

  const nextDate = stats.next?.event
    ? new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(new Date(stats.next.event.fecha))
    : "—";

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">Hola de nuevo,</p>
        <h2 className="text-2xl font-bold font-display mb-1">{user?.nombreCompleto ?? "Estudiante"} 👋</h2>
        <p className="text-white/70 text-sm">{user?.correo}</p>
        <div className="mt-4 flex gap-3">
          <Button
            onClick={() => onNavigate("explore-events")}
            variant="secondary"
            size="sm"
            className="!bg-white !text-primary-700 hover:!bg-primary-50"
          >
            Explorar eventos
          </Button>
          <Button onClick={() => onNavigate("my-enrollments")} variant="ghost" size="sm" className="!text-white hover:!bg-white/10">
            Mis inscripciones
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button onClick={() => void load()} variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Inscripciones confirmadas"
          value={loading ? "…" : String(stats.confirmed.length)}
          sub={`${enrollments.length} en total`}
          icon={<CheckSquare size={20} />}
          color="primary"
        />
        <StatCard
          label="Pagos realizados"
          value={loading ? "…" : `S/ ${stats.paidTotal.toFixed(2)}`}
          sub={`${stats.approved.length} transacci${stats.approved.length === 1 ? "ón" : "ones"}`}
          icon={<CreditCard size={20} />}
          color="violet"
        />
        <StatCard
          label="Pendientes de pago"
          value={loading ? "…" : String(stats.pending.length)}
          sub={stats.pending.length > 0 ? "Completa tu pago" : "Todo al día"}
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard
          label="Próximo evento"
          value={loading ? "…" : nextDate}
          sub={stats.next?.event?.nombre ?? "Sin eventos próximos"}
          icon={<Calendar size={20} />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inscripciones vigentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">Mis próximos eventos</h3>
            <button
              onClick={() => onNavigate("my-enrollments")}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
            >
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">Cargando...</p>
          ) : active.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-500 mb-3">No tienes inscripciones a eventos próximos.</p>
              <Button onClick={() => onNavigate("explore-events")} size="sm" variant="secondary">
                Buscar eventos
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {active.map(({ enrollment, event }) => {
                const st = ENROLLMENT_STATUS[enrollment.estado];
                return (
                  <button
                    key={enrollment.id}
                    onClick={() => onSelectEvent(enrollment.eventoId)}
                    className="w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{event?.nombre}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDateTime(event?.fecha)} · {event?.lugar}
                      </p>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sugerencias */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">Eventos que te pueden interesar</h3>
            <button
              onClick={() => onNavigate("explore-events")}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
            >
              Ver más <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">Cargando...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500 text-center">Ya estás inscrito en todos los eventos disponibles.</p>
          ) : (
            <div className="flex flex-col">
              {suggestions.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className="text-left flex flex-col gap-1 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{ev.nombre}</p>
                    {Number(ev.precio) > 0 ? (
                      <span className="text-xs font-bold text-primary-600 whitespace-nowrap">{formatMoney(ev.precio)}</span>
                    ) : (
                      <Badge variant="free" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={12} />
                    <span>{formatDateTime(ev.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={12} />
                    <span className="truncate">{ev.lugar}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users size={12} />
                    <span>{ev.cuposDisponibles} cupos disponibles</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
