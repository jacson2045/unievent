import React, { useMemo, useState } from "react";
import { Download, RefreshCw, Search, Users } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ENROLLMENT_STATUS, PAYMENT_STATUS, formatDateTime, formatMoney } from "../../utils/status";
import type { EnrollmentStatus } from "../../types/enrollment";
import { downloadCsv, useOrganizerData } from "./useOrganizerData";

interface Props {
  /** Evento preseleccionado (por ejemplo, al venir desde "Mis eventos"). */
  initialEventId?: number | null;
}

export default function Participants({ initialEventId = null }: Props) {
  const { events, enrollments, eventsById, loading, error, reload } = useOrganizerData();
  const [eventId, setEventId] = useState<string>(initialEventId ? String(initialEventId) : "all");
  const [status, setStatus] = useState<"all" | EnrollmentStatus>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrollments.filter(
      (e) =>
        (eventId === "all" || e.eventoId === Number(eventId)) &&
        (status === "all" || e.estado === status) &&
        (!q || e.estudianteCorreo.toLowerCase().includes(q)),
    );
  }, [enrollments, eventId, status, query]);

  const selectedEvent = eventId === "all" ? null : eventsById.get(Number(eventId)) ?? null;
  const confirmed = rows.filter((r) => r.estado === "CONFIRMADA").length;

  const exportCsv = () => {
    downloadCsv(
      `participantes${selectedEvent ? `-evento-${selectedEvent.id}` : ""}.csv`,
      ["Inscripción", "Estudiante", "Evento", "Fecha de inscripción", "Estado", "Pago", "Monto", "Asistencia"],
      rows.map((r) => [
        r.id,
        r.estudianteCorreo,
        eventsById.get(r.eventoId)?.nombre ?? `#${r.eventoId}`,
        formatDateTime(r.fechaInscripcion),
        ENROLLMENT_STATUS[r.estado].label,
        r.pagoEstado ? PAYMENT_STATUS[r.pagoEstado].label : "Sin pago",
        r.pagoMonto ? Number(r.pagoMonto).toFixed(2) : "0.00",
        r.fechaAsistencia ? formatDateTime(r.fechaAsistencia) : "",
      ]),
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Participantes</h2>
          <p className="text-sm text-slate-500">
            {selectedEvent
              ? `${confirmed} confirmados de ${selectedEvent.capacidad} cupos en «${selectedEvent.nombre}»`
              : "Estudiantes inscritos en tus eventos."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void reload()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
            Actualizar
          </Button>
          <Button onClick={exportCsv} variant="secondary" size="sm" icon={<Download size={14} />} disabled={rows.length === 0}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] flex flex-wrap gap-3">
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none min-w-56"
        >
          <option value="all">Todos mis eventos</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nombre}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="CONFIRMADA">Confirmadas</option>
          <option value="PENDIENTE">Pendientes de pago</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por correo..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users size={32} className="text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">Sin participantes</h3>
          <p className="text-sm text-slate-400">
            {enrollments.length === 0 ? "Todavía nadie se inscribió en tus eventos." : "Ningún participante coincide con los filtros."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Estudiante", "Evento", "Inscripción", "Estado", "Pago", "Monto", "Asistencia"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = ENROLLMENT_STATUS[r.estado];
                  const pay = r.pagoEstado ? PAYMENT_STATUS[r.pagoEstado] : null;
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {r.estudianteCorreo.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-900">{r.estudianteCorreo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[220px] truncate">
                        {eventsById.get(r.eventoId)?.nombre ?? `#${r.eventoId}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-400">#{r.id}</span> · {formatDateTime(r.fechaInscripcion)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {pay ? <Badge variant={pay.variant}>{pay.label}</Badge> : <Badge variant="free">Sin pago</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {formatMoney(r.pagoMonto ?? 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.fechaAsistencia ? (
                          <Badge variant="attended">Asistió</Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            {rows.length} registro{rows.length === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
