import React from "react";
import { Calendar, Clock, MapPin, Users, Building2, Tag, ArrowLeft, Share2, Heart, CheckCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { events } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

export default function EventDetail({ onNavigate }: Props) {
  const ev = events[0];
  const available = ev.capacity - ev.enrolled;
  const pct = Math.round((ev.enrolled / ev.capacity) * 100);

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate("explore-events")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">
          <ArrowLeft size={16} />
          Volver a eventos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Banner */}
          <div className="relative h-64 md:h-80 bg-slate-200 rounded-2xl overflow-hidden">
            <img src={ev.image} alt={ev.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex gap-2 mb-2">
                <Badge variant="active">{ev.modality}</Badge>
                <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-full">{ev.category}</span>
              </div>
              <h1 className="text-white font-bold text-xl md:text-2xl font-display leading-tight">{ev.title}</h1>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <h2 className="font-bold text-slate-900 font-display mb-3">Sobre este evento</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">{ev.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Calendar size={16} />, label: "Fecha", value: ev.date },
                { icon: <Clock size={16} />, label: "Horario", value: `${ev.time} – ${ev.endTime}` },
                { icon: <MapPin size={16} />, label: "Lugar", value: ev.location },
                { icon: <Building2 size={16} />, label: "Organizador", value: ev.organizer },
                { icon: <Users size={16} />, label: "Capacidad", value: `${ev.capacity} personas` },
                { icon: <Tag size={16} />, label: "Categoría", value: ev.category },
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
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <h2 className="font-bold text-slate-900 font-display mb-3">Requisitos</h2>
            <p className="text-sm text-slate-600">{ev.requirements}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ev.tags.map(t => (
                <span key={t} className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <h2 className="font-bold text-slate-900 font-display mb-3">Ubicación</h2>
            <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin size={28} className="text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{ev.location}</p>
                <p className="text-xs text-slate-400">Campus Universitario</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / CTA */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] sticky top-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                {ev.price > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-primary-700 font-display">S/ {ev.price.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">por persona</p>
                  </>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-green-600 font-display">Gratuito</p>
                    <p className="text-xs text-slate-400">Sin costo de inscripción</p>
                  </div>
                )}
              </div>
              <Badge variant="active" dot />
            </div>

            {/* Capacity bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">{ev.enrolled} inscritos</span>
                <span className={available < 50 ? "text-amber-600 font-bold" : ""}>{available} cupos libres</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-primary-500"}`} style={{ width: `${pct}%` }} />
              </div>
              {pct >= 80 && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠ Pocas plazas disponibles</p>
              )}
            </div>

            <Button onClick={() => onNavigate("enrollment-flow")} fullWidth size="lg" className="mb-3">
              {ev.price > 0 ? "Inscribirme y pagar" : "Inscribirme gratis"}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" icon={<Share2 size={15} />}>Compartir</Button>
              <Button variant="ghost" size="sm" className="flex-1" icon={<Heart size={15} />}>Guardar</Button>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col gap-2">
              {[
                { icon: <CheckCircle size={14} className="text-green-500" />, text: "Certificado de asistencia" },
                { icon: <CheckCircle size={14} className="text-green-500" />, text: "Acceso a materiales" },
                { icon: <CheckCircle size={14} className="text-green-500" />, text: "Almuerzo incluido" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-600">{icon}{text}</div>
              ))}
            </div>
          </div>

          {/* Organizer card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
            <p className="text-xs text-slate-400 font-medium mb-2">Organizado por</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{ev.organizer}</p>
                <p className="text-xs text-slate-400">Verificado ✓</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
