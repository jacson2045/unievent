import React, { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Calendar, CheckSquare, CreditCard, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "../../components/ui/Card";
import { MONITORED_SERVICES, getServiceHealth, listUsers, type ServiceHealth } from "../../api/adminApi";
import type { Profile } from "../../api/authApi";
import { getEvents } from "../../api/eventsApi";
import { getOrganizerEnrollments } from "../../api/enrollmentApi";
import type { BackendEvent } from "../../types/event";
import type { Enrollment } from "../../types/enrollment";

interface Props {
  onNavigate: (page: string) => void;
}

const DAYS = 14;

export default function AdminDashboard({ onNavigate }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  // Para un ADMIN, este endpoint devuelve las inscripciones de todos los eventos.
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [u, e, i] = await Promise.all([listUsers(), getEvents(), getOrganizerEnrollments()]);
        setUsers(u);
        setEvents(e);
        setEnrollments(i);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar las métricas.");
      } finally {
        setLoading(false);
      }
      setHealth(await Promise.all(MONITORED_SERVICES.map((s) => getServiceHealth(s.id))));
    })();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      students: users.filter((u) => u.rol === "ESTUDIANTE").length,
      organizers: users.filter((u) => u.rol === "ORGANIZADOR").length,
      activeEvents: events.filter((e) => e.estado === "ACTIVO" && new Date(e.fecha).getTime() > now).length,
      confirmed: enrollments.filter((e) => e.estado === "CONFIRMADA").length,
      attended: enrollments.filter((e) => e.fechaAsistencia).length,
      revenue: enrollments.filter((e) => e.pagoEstado === "APPROVED").reduce((a, e) => a + Number(e.pagoMonto ?? 0), 0),
      paid: enrollments.filter((e) => e.pagoEstado === "APPROVED").length,
    };
  }, [users, events, enrollments]);

  // Inscripciones y registros de usuarios por día (últimas dos semanas).
  const trend = useMemo(() => {
    const days: { key: string; dia: string; Inscripciones: number; Registros: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toDateString(),
        dia: new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(d),
        Inscripciones: 0,
        Registros: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    enrollments.forEach((e) => {
      const i = idx.get(new Date(e.fechaInscripcion).toDateString());
      if (i !== undefined) days[i].Inscripciones++;
    });
    users.forEach((u) => {
      const i = idx.get(new Date(u.creadoEn).toDateString());
      if (i !== undefined) days[i].Registros++;
    });
    return days;
  }, [enrollments, users]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      const k = e.categoria?.nombre ?? "Sin categoría";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].map(([categoria, Eventos]) => ({ categoria, Eventos }));
  }, [events]);

  const topEvents = useMemo(() => [...events].sort((a, b) => b.inscritos - a.inscritos).slice(0, 5), [events]);
  const servicesUp = health.filter((h) => h.status === "UP").length;

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Panel de administración</h2>
        <p className="text-sm text-slate-500">Visión global de la plataforma.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Usuarios" value={loading ? "…" : String(users.length)} sub={`${stats.students} estudiantes · ${stats.organizers} organizadores`} icon={<Users size={20} />} color="primary" />
        <StatCard label="Eventos activos" value={loading ? "…" : String(stats.activeEvents)} sub={`${events.length} en total`} icon={<Calendar size={20} />} color="violet" />
        <StatCard label="Inscripciones confirmadas" value={loading ? "…" : String(stats.confirmed)} sub={`${stats.attended} con asistencia registrada`} icon={<CheckSquare size={20} />} color="green" />
        <StatCard label="Recaudado" value={loading ? "…" : `S/ ${stats.revenue.toFixed(2)}`} sub={`${stats.paid} pagos aprobados`} icon={<CreditCard size={20} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-3">Actividad de los últimos {DAYS} días</h3>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval={1} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Inscripciones" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Registros" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <button
          onClick={() => onNavigate("system-monitoring")}
          className="text-left bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5 hover:border-primary-200 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 font-display flex items-center gap-2">
              <Activity size={18} className="text-primary-600" /> Estado de servicios
            </h3>
            <ArrowRight size={16} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold font-display text-slate-900">
            {health.length ? `${servicesUp}/${MONITORED_SERVICES.length}` : "…"}
          </p>
          <p className="text-sm text-slate-500 mb-4">servicios en línea</p>
          <div className="flex flex-col gap-1.5">
            {MONITORED_SERVICES.map((s) => {
              const h = health.find((x) => x.id === s.id);
              return (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{s.label}</span>
                  <span className={`w-2 h-2 rounded-full ${!h ? "bg-slate-300" : h.status === "UP" ? "bg-green-500" : "bg-red-500"}`} />
                </div>
              );
            })}
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-3">Eventos por categoría</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Eventos" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-3">Eventos con más inscritos</h3>
          {topEvents.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Sin eventos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topEvents.map((e) => {
                const pct = e.capacidad ? Math.round((e.inscritos / e.capacidad) * 100) : 0;
                return (
                  <div key={e.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 truncate">{e.nombre}</span>
                      <span className="text-slate-500 whitespace-nowrap">
                        {e.inscritos}/{e.capacidad}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
