import React, { useMemo } from "react";
import { ArrowRight, Calendar, CreditCard, Plus, TrendingUp, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getUser } from "../../utils/auth";
import { ENROLLMENT_STATUS, formatDateTime } from "../../utils/status";
import { eventStatus } from "./MyEvents";
import { useOrganizerData } from "./useOrganizerData";

interface Props {
  onNavigate: (p: string) => void;
  onViewParticipants: (eventId: number) => void;
}

const DAYS = 14;

export default function OrganizerDashboard({ onNavigate, onViewParticipants }: Props) {
  const user = getUser();
  const { events, enrollments, eventsById, loading, error } = useOrganizerData();

  const stats = useMemo(() => {
    const now = Date.now();
    const active = events.filter((e) => e.estado === "ACTIVO" && new Date(e.fecha).getTime() > now);
    const confirmed = enrollments.filter((e) => e.estado === "CONFIRMADA").length;
    const revenue = enrollments
      .filter((e) => e.pagoEstado === "APPROVED")
      .reduce((a, e) => a + Number(e.pagoMonto ?? 0), 0);
    const cap = active.reduce((a, e) => a + e.capacidad, 0);
    const ins = active.reduce((a, e) => a + e.inscritos, 0);
    return { active, confirmed, revenue, occupancy: cap ? Math.round((ins / cap) * 100) : 0 };
  }, [events, enrollments]);

  // Inscripciones por día en las últimas dos semanas.
  const trend = useMemo(() => {
    const days: { dia: string; key: string; Inscripciones: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toISOString().slice(0, 10),
        dia: new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(d),
        Inscripciones: 0,
      });
    }
    const index = new Map(days.map((d, i) => [d.key, i]));
    enrollments.forEach((e) => {
      const local = new Date(e.fechaInscripcion);
      const key = new Date(local.getFullYear(), local.getMonth(), local.getDate()).toISOString().slice(0, 10);
      const i = index.get(key);
      if (i !== undefined) days[i].Inscripciones++;
    });
    return days;
  }, [enrollments]);

  const upcoming = [...stats.active]
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 4);
  const latest = enrollments.slice(0, 6);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white/70 text-sm mb-1">Panel del organizador</p>
          <h2 className="text-2xl font-bold font-display">{user?.nombreCompleto ?? "Organizador"}</h2>
          <p className="text-white/70 text-sm">{user?.correo}</p>
        </div>
        <Button
          onClick={() => onNavigate("create-event")}
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          className="!bg-white !text-primary-700 hover:!bg-primary-50"
        >
          Crear evento
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Eventos activos" value={loading ? "…" : String(stats.active.length)} sub={`${events.length} en total`} icon={<Calendar size={20} />} color="primary" />
        <StatCard label="Inscritos confirmados" value={loading ? "…" : String(stats.confirmed)} sub={`${enrollments.length} inscripciones`} icon={<Users size={20} />} color="violet" />
        <StatCard label="Recaudado" value={loading ? "…" : `S/ ${stats.revenue.toFixed(2)}`} sub="Pagos aprobados" icon={<CreditCard size={20} />} color="green" />
        <StatCard label="Ocupación" value={loading ? "…" : `${stats.occupancy}%`} sub="Eventos activos" icon={<TrendingUp size={20} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-3">Inscripciones de los últimos {DAYS} días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Inscripciones" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3, fill: "#4F46E5" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">Próximos eventos</h3>
            <button onClick={() => onNavigate("my-events")} className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          {loading ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">Cargando...</p>
          ) : upcoming.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500 text-center">No tienes eventos próximos.</p>
          ) : (
            upcoming.map((ev) => {
              const st = eventStatus(ev);
              return (
                <button
                  key={ev.id}
                  onClick={() => onViewParticipants(ev.id)}
                  className="w-full text-left px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ev.nombre}</p>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(ev.fecha)} · {ev.inscritos}/{ev.capacidad} inscritos
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 font-display">Últimas inscripciones</h3>
          <button onClick={() => onNavigate("participants")} className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
            Ver participantes <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Cargando...</p>
        ) : latest.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500 text-center">Todavía no hay inscripciones en tus eventos.</p>
        ) : (
          latest.map((e) => {
            const st = ENROLLMENT_STATUS[e.estado];
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {e.estudianteCorreo.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">{e.estudianteCorreo}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {eventsById.get(e.eventoId)?.nombre ?? `#${e.eventoId}`} · {formatDateTime(e.fechaInscripcion)}
                  </p>
                </div>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
