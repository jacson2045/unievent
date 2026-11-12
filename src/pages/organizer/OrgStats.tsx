import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw } from "lucide-react";
import Button from "../../components/ui/Button";
import { useOrganizerData } from "./useOrganizerData";

const STATUS_COLORS = { CONFIRMADA: "#16A34A", PENDIENTE: "#F59E0B", CANCELADA: "#EF4444" } as const;

function shortName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

export default function OrgStats() {
  const { events, enrollments, loading, error, reload } = useOrganizerData();

  const occupancy = useMemo(
    () =>
      events
        .filter((e) => e.estado !== "CANCELADO")
        .map((e) => ({ nombre: shortName(e.nombre), Inscritos: e.inscritos, Disponibles: e.cuposDisponibles })),
    [events],
  );

  const revenue = useMemo(() => {
    const map = new Map<number, number>();
    enrollments
      .filter((e) => e.pagoEstado === "APPROVED")
      .forEach((e) => map.set(e.eventoId, (map.get(e.eventoId) ?? 0) + Number(e.pagoMonto ?? 0)));
    return events
      .filter((e) => map.has(e.id))
      .map((e) => ({ nombre: shortName(e.nombre), Recaudado: Number((map.get(e.id) ?? 0).toFixed(2)) }));
  }, [events, enrollments]);

  const byStatus = useMemo(
    () =>
      (["CONFIRMADA", "PENDIENTE", "CANCELADA"] as const)
        .map((s) => ({ name: s === "CONFIRMADA" ? "Confirmadas" : s === "PENDIENTE" ? "Pendientes" : "Canceladas", value: enrollments.filter((e) => e.estado === s).length, color: STATUS_COLORS[s] }))
        .filter((d) => d.value > 0),
    [enrollments],
  );

  const paidAttempts = enrollments.filter((e) => e.pagoEstado !== null);
  const conversion = paidAttempts.length
    ? Math.round((paidAttempts.filter((e) => e.pagoEstado === "APPROVED").length / paidAttempts.length) * 100)
    : null;
  const totalCap = events.filter((e) => e.estado !== "CANCELADO").reduce((a, e) => a + e.capacidad, 0);
  const totalIns = events.filter((e) => e.estado !== "CANCELADO").reduce((a, e) => a + e.inscritos, 0);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Estadísticas</h2>
          <p className="text-sm text-slate-500">Desempeño de tus eventos.</p>
        </div>
        <Button onClick={() => void reload()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="Ocupación global" value={totalCap ? `${Math.round((totalIns / totalCap) * 100)}%` : "—"} sub={`${totalIns} de ${totalCap} cupos`} />
        <Kpi label="Inscripciones totales" value={String(enrollments.length)} sub={`${enrollments.filter((e) => e.estado === "CONFIRMADA").length} confirmadas`} />
        <Kpi label="Pagos aprobados" value={conversion === null ? "—" : `${conversion}%`} sub="De los intentos de pago" />
      </div>

      {loading ? (
        <div className="h-72 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-12 bg-white rounded-2xl border border-slate-100">
          Crea un evento para ver sus estadísticas.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard title="Ocupación por evento" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Inscritos" stackId="a" fill="#4F46E5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Disponibles" stackId="a" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estado de las inscripciones">
            {byStatus.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">Sin inscripciones todavía.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {byStatus.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Recaudación por evento (S/)" className="lg:col-span-3">
            {revenue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">Aún no hay pagos aprobados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `S/ ${Number(v).toFixed(2)}`} />
                  <Bar dataKey="Recaudado" fill="#16A34A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 font-display mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5 ${className}`}>
      <h3 className="font-semibold text-slate-900 font-display mb-3">{title}</h3>
      {children}
    </div>
  );
}
