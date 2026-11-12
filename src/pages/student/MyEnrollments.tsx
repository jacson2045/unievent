import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, CreditCard, RefreshCw, Ticket } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getMyEnrollmentsWithEvents, type EnrollmentWithEvent } from "../../api/enrollmentApi";
import type { EnrollmentStatus } from "../../types/enrollment";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS,
  formatDateTime,
  formatMoney,
} from "../../utils/status";

interface Props {
  onNavigate: (p: string) => void;
  onSelectEvent: (eventId: number) => void;
  onContinuePayment: (eventId: number) => void;
}

type Filter = "ALL" | EnrollmentStatus;

const FILTERS: { id: EnrollmentStatus; label: string; color: string }[] = [
  { id: "CONFIRMADA", label: "Confirmadas", color: "text-green-600 bg-green-50" },
  { id: "PENDIENTE", label: "Pendientes", color: "text-amber-600 bg-amber-50" },
  { id: "CANCELADA", label: "Canceladas", color: "text-red-600 bg-red-50" },
];

function amountOf(item: EnrollmentWithEvent): number {
  return Number(item.enrollment.pagoMonto ?? item.event?.precio ?? 0);
}

export default function MyEnrollments({ onNavigate, onSelectEvent, onContinuePayment }: Props) {
  const [items, setItems] = useState<EnrollmentWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await getMyEnrollmentsWithEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus inscripciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<EnrollmentStatus, number> = { CONFIRMADA: 0, PENDIENTE: 0, CANCELADA: 0 };
    items.forEach((i) => c[i.enrollment.estado]++);
    return c;
  }, [items]);

  const visible = filter === "ALL" ? items : items.filter((i) => i.enrollment.estado === filter);

  const actions = (item: EnrollmentWithEvent, compact: boolean) => {
    const { enrollment, event } = item;
    const btn = compact
      ? "w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
      : "";
    return (
      <>
        {event &&
          (compact ? (
            <button onClick={() => onSelectEvent(event.id)} className={btn} title="Ver evento">
              <Eye size={15} />
            </button>
          ) : (
            <Button onClick={() => onSelectEvent(event.id)} variant="ghost" size="sm" icon={<Eye size={14} />} fullWidth>
              Ver evento
            </Button>
          ))}
        {enrollment.estado === "PENDIENTE" && event && (
          compact ? (
            <button
              onClick={() => onContinuePayment(event.id)}
              className={`${btn} !text-primary-600`}
              title="Completar pago"
            >
              <CreditCard size={15} />
            </button>
          ) : (
            <Button onClick={() => onContinuePayment(event.id)} size="sm" icon={<CreditCard size={14} />} fullWidth>
              Completar pago
            </Button>
          )
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando tus inscripciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
        <p className="font-semibold mb-1">No se pudieron cargar tus inscripciones</p>
        <p className="mb-4">{error}</p>
        <Button onClick={() => void load()} variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Mis inscripciones</h2>
          <p className="text-sm text-slate-500">
            {items.length} inscripci{items.length === 1 ? "ón" : "ones"} en total
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant={view === "table" ? "primary" : "ghost"} size="sm" onClick={() => setView("table")}>
              Tabla
            </Button>
            <Button variant={view === "cards" ? "primary" : "ghost"} size="sm" onClick={() => setView("cards")}>
              Tarjetas
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Ticket size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Aún no tienes inscripciones</h3>
          <p className="text-sm text-slate-400 mb-4">Explora los eventos disponibles y únete al que te interese.</p>
          <Button onClick={() => onNavigate("explore-events")} size="sm">
            Explorar eventos
          </Button>
        </div>
      ) : (
        <>
          {/* Resumen (también sirve de filtro) */}
          <div className="grid grid-cols-3 gap-4">
            {FILTERS.map(({ id, label, color }) => (
              <button
                key={id}
                onClick={() => setFilter(filter === id ? "ALL" : id)}
                className={`rounded-2xl p-4 flex flex-col items-center transition-all ${color} ${filter === id ? "ring-2 ring-offset-2 ring-current" : "hover:opacity-80"}`}
              >
                <span className="text-2xl font-bold font-display">{counts[id]}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay inscripciones con ese estado.</p>
          ) : view === "table" ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {["Evento", "Inscripción", "Estado", "Pago", "Monto", "Acciones"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => {
                      const { enrollment, event } = item;
                      const st = ENROLLMENT_STATUS[enrollment.estado];
                      const pay = enrollment.pagoEstado ? PAYMENT_STATUS[enrollment.pagoEstado] : null;
                      return (
                        <tr key={enrollment.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar size={14} className="text-primary-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[220px]">
                                  {event?.nombre ?? `Evento #${enrollment.eventoId} (no disponible)`}
                                </p>
                                <p className="text-xs text-slate-400">{event ? formatDateTime(event.fecha) : "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-400">#{enrollment.id}</span>
                            <br />
                            {formatDateTime(enrollment.fechaInscripcion)}
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            {pay ? (
                              <Badge variant={pay.variant}>{pay.label}</Badge>
                            ) : amountOf(item) <= 0 ? (
                              <Badge variant="free">Sin pago</Badge>
                            ) : (
                              <span className="text-xs text-slate-400">No iniciado</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                            {formatMoney(amountOf(item))}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">{actions(item, true)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visible.map((item) => {
                const { enrollment, event } = item;
                const st = ENROLLMENT_STATUS[enrollment.estado];
                const pay = enrollment.pagoEstado ? PAYMENT_STATUS[enrollment.pagoEstado] : null;
                return (
                  <div key={enrollment.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
                    <div className="flex gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-violet-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {event?.imagenUrl ? (
                          <img src={event.imagenUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Calendar size={22} className="text-white/80" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {event?.nombre ?? `Evento #${enrollment.eventoId}`}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{event ? formatDateTime(event.fecha) : "—"}</p>
                        <p className="text-xs text-slate-500">{event?.lugar}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{formatMoney(amountOf(item))}</span>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {pay && <Badge variant={pay.variant}>{pay.label}</Badge>}
                    </div>
                    <div className="flex gap-2">{actions(item, false)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
