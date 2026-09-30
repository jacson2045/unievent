import React, { useState } from "react";
import { Calendar, CreditCard, QrCode, Eye, Download } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { myEnrollments } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

export default function MyEnrollments({ onNavigate }: Props) {
  const [view, setView] = useState<"table" | "cards">("table");

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Mis inscripciones</h2>
          <p className="text-sm text-slate-500">{myEnrollments.length} inscripciones en total</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "table" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >Tabla</Button>
          <Button
            variant={view === "cards" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("cards")}
          >Tarjetas</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Confirmadas", count: 3, color: "text-green-600 bg-green-50" },
          { label: "Pendientes", count: 0, color: "text-amber-600 bg-amber-50" },
          { label: "Canceladas", count: 0, color: "text-red-600 bg-red-50" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded-2xl p-4 flex flex-col items-center ${color}`}>
            <span className="text-2xl font-bold font-display">{count}</span>
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Table view */}
      {view === "table" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Evento", "Fecha inscripción", "Estado inscripción", "Pago", "Monto", "Asistencia", "Acciones"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map((en) => (
                  <tr key={en.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[200px]">{en.event.title}</p>
                          <p className="text-xs text-slate-400">{en.event.date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{en.enrolledAt}</td>
                    <td className="px-4 py-4"><Badge variant={en.enrollmentStatus as any} /></td>
                    <td className="px-4 py-4"><Badge variant={en.paymentStatus as any} /></td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {en.paymentAmount === 0 ? "Gratuito" : `S/ ${en.paymentAmount.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={en.attendance === "attended" ? "attended" : "pending"}>
                        {en.attendance === "attended" ? "Asistió" : "Pendiente"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => onNavigate("event-detail")} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" title="Ver">
                          <Eye size={15} />
                        </button>
                        {en.attendance === "pending" && (
                          <button onClick={() => onNavigate("my-attendance")} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" title="Mi QR">
                            <QrCode size={15} />
                          </button>
                        )}
                        {en.paymentStatus === "approved" && (
                          <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors" title="Descargar comprobante">
                            <Download size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myEnrollments.map((en) => (
            <div key={en.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
              <div className="flex gap-3 mb-4">
                <img src={en.event.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{en.event.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{en.event.date}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                <Badge variant={en.enrollmentStatus as any} />
                <Badge variant={en.paymentStatus as any} />
                <Badge variant={en.attendance === "attended" ? "attended" : "pending"}>
                  {en.attendance === "attended" ? "Asistió" : "Pendiente"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onNavigate("event-detail")} variant="ghost" size="sm" icon={<Eye size={14} />} fullWidth>Ver</Button>
                <Button onClick={() => onNavigate("my-attendance")} variant="secondary" size="sm" icon={<QrCode size={14} />} fullWidth>Mi QR</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
