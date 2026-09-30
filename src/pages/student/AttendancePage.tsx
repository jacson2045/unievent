import React from "react";
import { QrCode, CheckCircle, Clock, Calendar, MapPin } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { myEnrollments } from "../../data/mockData";

export default function AttendancePage() {
  const enrollment = myEnrollments[0];

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Mi asistencia</h2>
        <p className="text-sm text-slate-500">Presenta este QR en la entrada del evento para registrar tu asistencia.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-6 text-left w-full p-4 bg-primary-50 rounded-xl">
          <img src={enrollment.event.image} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-900 text-sm">{enrollment.event.title}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1"><Calendar size={11} />{enrollment.event.date}</span>
              <span className="flex items-center gap-1"><Clock size={11} />{enrollment.event.time}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={11} />{enrollment.event.location}
            </div>
          </div>
        </div>

        {/* QR Code display */}
        <div className="relative w-52 h-52 bg-white border-2 border-slate-900 rounded-2xl p-4 mb-5 shadow-[0_4px_12px_-2px_rgb(0_0_0/0.12)]">
          <div className="absolute inset-4 grid grid-cols-9 grid-rows-9 gap-0.5">
            {Array.from({ length: 81 }).map((_, i) => {
              const row = Math.floor(i / 9);
              const col = i % 9;
              const cornerTopLeft = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
              const inner = (row >= 1 && row <= 1 && col >= 1 && col <= 1) || (row >= 1 && row <= 1 && col >= 7 && col <= 7) || (row >= 7 && row <= 7 && col >= 1 && col <= 1);
              const fill = cornerTopLeft || inner || (Math.sin(i * 0.7) > 0.1);
              return <div key={i} className={`rounded-sm ${fill ? "bg-slate-900" : "bg-transparent"}`} />;
            })}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              <QrCode size={20} className="text-primary-600" />
            </div>
          </div>
        </div>

        <p className="font-mono text-sm text-slate-600 mb-1 tracking-widest">ANR-20211234-CIAI-01</p>
        <p className="text-xs text-slate-400 mb-4">Código personal de asistencia</p>

        <div className="flex items-center gap-2 mb-6">
          <Badge variant="pending" dot>Pendiente de registro</Badge>
        </div>

        <div className="w-full flex flex-col gap-2 text-sm">
          {[
            { label: "Nombre", value: "Ana Lucía Ramírez Torres" },
            { label: "Código", value: "20211234" },
            { label: "Evento", value: enrollment.event.title },
            { label: "Estado asistencia", value: "Pendiente" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0 text-left">
              <span className="text-slate-500">{label}</span>
              <span className="font-semibold text-slate-900 text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {myEnrollments.map((en) => (
          <div key={en.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 line-clamp-1">{en.event.title}</p>
                <p className="text-xs text-slate-500">{en.event.date}</p>
              </div>
              {en.attendance === "attended"
                ? <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                : <Clock size={20} className="text-amber-400 flex-shrink-0" />}
            </div>
            <Badge variant={en.attendance === "attended" ? "attended" : "pending"}>
              {en.attendance === "attended" ? "Asistió" : "Pendiente"}
            </Badge>
            {en.attendance === "attended" && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Clock size={11} />Registrado el {en.enrolledAt} a las 09:14 AM</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
