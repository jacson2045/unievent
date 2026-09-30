import React from "react";
import { Users, Calendar, BookOpen, CreditCard, CheckSquare, Activity } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { adminMetricsTrend } from "../../data/mockData";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Dashboard Administrador</h2>
        <p className="text-sm text-slate-500">Visión global del sistema UniEvent Pay.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Usuarios" value="524" sub="+12 esta semana" icon={<Users size={20} />} color="primary" />
        <StatCard label="Eventos" value="28" sub="5 este mes" icon={<Calendar size={20} />} color="violet" />
        <StatCard label="Inscripciones" value="1,340" sub="+89 hoy" icon={<BookOpen size={20} />} color="sky" />
        <StatCard label="Pagos" value="1,120" sub="S/. 48,200" icon={<CreditCard size={20} />} color="green" />
        <StatCard label="Asistencias" value="987" sub="73.7%" icon={<CheckSquare size={20} />} color="amber" />
        <StatCard label="Servicios" value="5/6" sub="1 degradado" icon={<Activity size={20} />} color="red" />
      </div>

      {/* Role breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { role: "Estudiantes", count: 498, color: "from-primary-500 to-primary-700" },
          { role: "Organizadores", count: 24, color: "from-violet-500 to-violet-700" },
          { role: "Administradores", count: 2, color: "from-slate-600 to-slate-800" },
        ].map(({ role, count, color }) => (
          <div key={role} className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white`}>
            <p className="text-3xl font-bold font-display">{count}</p>
            <p className="text-sm text-white/80">{role}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
        <h3 className="font-semibold text-slate-900 font-display mb-4">Tendencia del sistema (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={adminMetricsTrend}>
            <defs>
              <linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradInscripciones" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPagos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke="#4F46E5" fill="url(#gradUsuarios)" strokeWidth={2} />
            <Area type="monotone" dataKey="inscripciones" name="Inscripciones" stroke="#7C3AED" fill="url(#gradInscripciones)" strokeWidth={2} />
            <Area type="monotone" dataKey="pagos" name="Pagos" stroke="#16A34A" fill="url(#gradPagos)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
