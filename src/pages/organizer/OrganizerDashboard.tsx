import React from "react";
import { Calendar, Users, CreditCard, TrendingUp, ArrowRight, CheckSquare } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { enrollmentsByDay, paymentsByMethod, attendanceByEvent, events } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

export default function OrganizerDashboard({ onNavigate }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Dashboard del Organizador</h2>
          <p className="text-sm text-slate-500">Resumen de tus eventos y métricas clave.</p>
        </div>
        <Button onClick={() => onNavigate("create-event")} size="sm">+ Crear evento</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total eventos" value="6" sub="5 activos" icon={<Calendar size={20} />} color="primary" trend={{ value: "+2 este mes", up: true }} />
        <StatCard label="Total inscritos" value="849" sub="Todos los eventos" icon={<Users size={20} />} color="violet" trend={{ value: "+127 esta semana", up: true }} />
        <StatCard label="Ingresos simulados" value="S/ 14,280" sub="Ciclo actual" icon={<CreditCard size={20} />} color="green" trend={{ value: "+S/2,100 est. semana", up: true }} />
        <StatCard label="Tasa de asistencia" value="87%" sub="Promedio global" icon={<CheckSquare size={20} />} color="amber" trend={{ value: "+3% vs. ciclo ant.", up: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-4">Inscripciones por día</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={enrollmentsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Line type="monotone" dataKey="inscripciones" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4, fill: "#4F46E5" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-4">Métodos de pago</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={paymentsByMethod} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {paymentsByMethod.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {paymentsByMethod.map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-slate-600">{m.name}</span>
                  <span className="font-bold text-slate-900 ml-auto">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 font-display mb-4">Inscritos vs. Asistentes por evento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceByEvent} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="event" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E2E8F0" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="inscritos" fill="#C7D2FE" radius={[4, 4, 0, 0]} name="Inscritos" />
              <Bar dataKey="asistentes" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Asistentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 font-display">Mis eventos recientes</h3>
          <button onClick={() => onNavigate("my-events")} className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50">
                {["Evento", "Fecha", "Inscritos", "Cupos", "Precio", "Estado"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900 max-w-[220px] truncate">{ev.title}</p>
                    <p className="text-xs text-slate-400">{ev.category}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{ev.date}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{ev.enrolled}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{ev.capacity}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-primary-700">
                    {ev.price === 0 ? "Gratuito" : `S/ ${ev.price.toFixed(2)}`}
                  </td>
                  <td className="px-5 py-4"><Badge variant="active" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
