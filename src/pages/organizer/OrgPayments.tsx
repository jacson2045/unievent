import React, { useMemo, useState } from "react";
import { CreditCard, Download, RefreshCw, Wallet, Clock, XCircle } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PAYMENT_STATUS, formatDateTime } from "../../utils/status";
import type { PaymentStatus } from "../../types/enrollment";
import { downloadCsv, useOrganizerData } from "./useOrganizerData";

const money = (n: number) => `S/ ${n.toFixed(2)}`;

export default function OrgPayments() {
  const { enrollments, eventsById, loading, error, reload } = useOrganizerData();
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");

  // Solo inscripciones que tuvieron un intento de pago (los eventos gratuitos no generan pago).
  const payments = useMemo(() => enrollments.filter((e) => e.pagoEstado !== null), [enrollments]);
  const visible = status === "all" ? payments : payments.filter((p) => p.pagoEstado === status);

  const sum = (s: PaymentStatus) =>
    payments.filter((p) => p.pagoEstado === s).reduce((acc, p) => acc + Number(p.pagoMonto ?? 0), 0);
  const count = (s: PaymentStatus) => payments.filter((p) => p.pagoEstado === s).length;

  // Recaudación por evento (solo pagos aprobados).
  const byEvent = useMemo(() => {
    const map = new Map<number, { total: number; count: number }>();
    payments
      .filter((p) => p.pagoEstado === "APPROVED")
      .forEach((p) => {
        const cur = map.get(p.eventoId) ?? { total: 0, count: 0 };
        cur.total += Number(p.pagoMonto ?? 0);
        cur.count += 1;
        map.set(p.eventoId, cur);
      });
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [payments]);

  const exportCsv = () =>
    downloadCsv(
      "pagos.csv",
      ["Inscripción", "Estudiante", "Evento", "Fecha", "Estado del pago", "Método", "Operación", "Monto"],
      visible.map((p) => [
        p.id,
        p.estudianteCorreo,
        eventsById.get(p.eventoId)?.nombre ?? `#${p.eventoId}`,
        formatDateTime(p.fechaInscripcion),
        p.pagoEstado ? PAYMENT_STATUS[p.pagoEstado].label : "",
        p.pagoMetodo ?? "",
        p.pagoTransaccion ?? "",
        Number(p.pagoMonto ?? 0).toFixed(2),
      ]),
    );

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Pagos</h2>
          <p className="text-sm text-slate-500">Pagos de inscripciones a tus eventos (Mercado Pago).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void reload()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
            Actualizar
          </Button>
          <Button onClick={exportCsv} variant="secondary" size="sm" icon={<Download size={14} />} disabled={visible.length === 0}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recaudado" value={loading ? "…" : money(sum("APPROVED"))} sub={`${count("APPROVED")} pagos aprobados`} icon={<Wallet size={20} />} color="green" />
        <StatCard label="Por cobrar" value={loading ? "…" : money(sum("PENDING"))} sub={`${count("PENDING")} pendientes`} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Rechazados" value={loading ? "…" : String(count("REJECTED") + count("CANCELLED"))} sub="Inscripciones anuladas" icon={<XCircle size={20} />} color="violet" />
        <StatCard label="Transacciones" value={loading ? "…" : String(payments.length)} sub="Intentos de pago" icon={<CreditCard size={20} />} color="primary" />
      </div>

      {byEvent.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
          <h3 className="font-semibold text-slate-900 font-display mb-3">Recaudación por evento</h3>
          <div className="flex flex-col gap-2">
            {byEvent.map(([id, v]) => (
              <div key={id} className="flex justify-between text-sm border-b border-slate-50 last:border-0 py-2">
                <span className="text-slate-700 truncate">{eventsById.get(id)?.nombre ?? `#${id}`}</span>
                <span className="font-semibold text-slate-900 whitespace-nowrap">
                  {money(v.total)} <span className="text-xs text-slate-400 font-normal">· {v.count} pago(s)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(["all", "APPROVED", "PENDING", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 h-8 rounded-lg text-sm font-medium transition-colors ${
              status === s ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {s === "all" ? "Todos" : PAYMENT_STATUS[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-100">
          <CreditCard size={32} className="text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">Sin pagos</h3>
          <p className="text-sm text-slate-400">
            {payments.length === 0 ? "Aún no hay pagos en tus eventos (los eventos gratuitos no generan pagos)." : "Ningún pago con ese estado."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Estudiante", "Evento", "Fecha", "Estado", "Método", "Operación", "Monto"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => {
                  const st = PAYMENT_STATUS[p.pagoEstado!];
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{p.estudianteCorreo}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[220px] truncate">
                        {eventsById.get(p.eventoId)?.nombre ?? `#${p.eventoId}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(p.fechaInscripcion)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.pagoMetodo ?? "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.pagoTransaccion ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {money(Number(p.pagoMonto ?? 0))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
