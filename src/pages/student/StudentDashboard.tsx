import React from "react";
import { Calendar, TrendingUp, CreditCard, CheckSquare, ArrowRight, Clock, MapPin, Users } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { events, myEnrollments } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

export default function StudentDashboard({ onNavigate }: Props) {
  const upcoming = events.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm mb-1">Bienvenida de vuelta,</p>
        <h2 className="text-2xl font-bold font-display mb-1">Ana Lucía Ramírez Torres 👋</h2>
        <p className="text-white/70 text-sm">Código: 20211234 · Ingeniería de Sistemas</p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => onNavigate("explore-events")} variant="secondary" size="sm" className="!bg-white !text-primary-700 hover:!bg-primary-50">
            Explorar eventos
          </Button>
          <Button onClick={() => onNavigate("my-enrollments")} variant="ghost" size="sm" className="!text-white hover:!bg-white/10">
            Mis inscripciones
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Eventos inscritos" value="3" sub="Este semestre" icon={<Calendar size={20} />} color="primary" trend={{ value: "+2 este mes", up: true }} />
        <StatCard label="Pagos realizados" value="S/ 70.00" sub="2 transacciones" icon={<CreditCard size={20} />} color="violet" />
        <StatCard label="Asistencias" value="1 / 3" sub="Tasa: 100%" icon={<CheckSquare size={20} />} color="green" />
        <StatCard label="Próximo evento" value="15 Sep" sub="Congreso de IA" icon={<Clock size={20} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis inscripciones */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">Mis inscripciones activas</h3>
            <button onClick={() => onNavigate("my-enrollments")} className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {myEnrollments.map((en) => (
              <div key={en.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{en.event.title}</p>
                  <p className="text-xs text-slate-500">{en.event.date} · {en.event.location}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={en.enrollmentStatus as any} />
                  <Badge variant={en.paymentStatus as any} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos eventos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 font-display">Próximos eventos</h3>
            <button onClick={() => onNavigate("explore-events")} className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
              Ver más <ArrowRight size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-0">
            {upcoming.map((ev) => (
              <div key={ev.id} className="flex flex-col gap-1 px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onNavigate("event-detail")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{ev.title}</p>
                  {ev.price > 0 ? <span className="text-xs font-bold text-primary-600 whitespace-nowrap">S/ {ev.price.toFixed(2)}</span> : <Badge variant="free" />}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>{ev.date} · {ev.time}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={12} />
                  <span className="truncate">{ev.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users size={12} />
                  <span>{ev.capacity - ev.enrolled} cupos disponibles</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
