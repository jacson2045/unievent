import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCw, Receipt, Printer, X, Wallet } from "lucide-react";
import { StatCard } from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { getMyPayments, getPaymentStatus } from "../../api/enrollmentApi";
import { getEvents } from "../../api/eventsApi";
import { getUser } from "../../utils/auth";
import { PAYMENT_STATUS, formatDateTime } from "../../utils/status";
import type { Payment } from "../../types/enrollment";
import type { BackendEvent } from "../../types/event";

interface Props {
  onNavigate: (page: string) => void;
}

const METHOD_LABELS: Record<string, string> = {
  visa: "Visa",
  master: "Mastercard",
  amex: "American Express",
  debvisa: "Visa Débito",
  debmaster: "Mastercard Débito",
  account_money: "Dinero en cuenta MP",
  yape: "Yape",
};

function methodLabel(m: string | null): string {
  if (!m) return "—";
  return METHOD_LABELS[m] ?? m;
}

function money(n: number): string {
  return `S/ ${Number(n).toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Abre el comprobante en una ventana aparte, lista para imprimir o guardar como PDF. */
function printReceipt(p: Payment, eventName: string) {
  const user = getUser();
  const rows: [string, string][] = [
    ["N.° de pago", `#${p.id}`],
    ["Inscripción", `#${p.inscripcionId}`],
    ["Estudiante", user?.nombreCompleto ?? ""],
    ["Correo", user?.correo ?? ""],
    ["Evento", eventName],
    ["Fecha de pago", formatDateTime(p.createdAt)],
    ["Método", methodLabel(p.metodo)],
    ["Operación Mercado Pago", p.transactionCode ?? "—"],
    ["Estado", PAYMENT_STATUS[p.estado].label],
  ];
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante de pago #${p.id}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:560px;margin:40px auto;padding:0 24px}
  h1{font-size:20px;margin:0}.muted{color:#64748b;font-size:13px}
  .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 0;border-bottom:1px solid #e2e8f0}td:last-child{text-align:right;font-weight:600}
  .total{margin-top:20px;display:flex;justify-content:space-between;font-size:18px;font-weight:700}
  .note{margin-top:28px;font-size:12px;color:#64748b}
</style></head><body>
<div class="head"><div><h1>UniEvent Pay</h1><div class="muted">Comprobante de pago</div></div><div class="muted">Emitido ${escapeHtml(formatDateTime(new Date().toISOString()))}</div></div>
<table>${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
<div class="total"><span>Total pagado</span><span>${money(p.monto)}</span></div>
<p class="note">Pago procesado por Mercado Pago (entorno de pruebas). Documento generado con fines académicos; no constituye comprobante tributario.</p>
<script>window.onload=function(){window.print()}</script>
</body></html>`;
  const win = window.open("", "_blank", "width=640,height=760");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function MyPayments({ onNavigate }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<Map<number, BackendEvent>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState<number | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pays, evs] = await Promise.all([getMyPayments(), getEvents()]);
      setPayments(pays);
      setEvents(new Map(evs.map((e) => [e.id, e])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar tus pagos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const eventName = (p: Payment) => events.get(p.eventoId)?.nombre ?? `Evento #${p.eventoId}`;

  /** Sincroniza un pago pendiente con Mercado Pago y recarga la lista. */
  const verify = async (p: Payment) => {
    setChecking(p.id);
    try {
      await getPaymentStatus(p.inscripcionId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo verificar el pago.");
    } finally {
      setChecking(null);
    }
  };

  const stats = useMemo(() => {
    const by = (s: Payment["estado"]) => payments.filter((p) => p.estado === s);
    const approved = by("APPROVED");
    return {
      total: approved.reduce((sum, p) => sum + Number(p.monto), 0),
      approved: approved.length,
      pending: by("PENDING").length,
      failed: by("REJECTED").length + by("CANCELLED").length,
    };
  }, [payments]);

  if (loading) {
    return (
      <div className="max-w-5xl bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando tus pagos...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Mis pagos</h2>
          <p className="text-sm text-slate-500">Historial de pagos realizados con Mercado Pago.</p>
        </div>
        <Button onClick={() => void load()} variant="ghost" size="sm" icon={<RefreshCw size={14} />}>
          Actualizar
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total pagado" value={money(stats.total)} icon={<Wallet size={20} />} color="primary" />
        <StatCard label="Aprobados" value={String(stats.approved)} icon={<CreditCard size={20} />} color="green" />
        <StatCard label="Pendientes" value={String(stats.pending)} icon={<RefreshCw size={20} />} color="amber" />
        <StatCard label="Rechazados / cancelados" value={String(stats.failed)} icon={<X size={20} />} color="violet" />
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Receipt size={28} className="text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Aún no tienes pagos</h3>
          <p className="text-sm text-slate-400 mb-4">Los pagos de eventos con costo aparecerán aquí.</p>
          <Button onClick={() => onNavigate("explore-events")} size="sm">
            Explorar eventos
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Fecha", "Evento", "Monto", "Método", "Estado", "Operación", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const st = PAYMENT_STATUS[p.estado];
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[220px]">{eventName(p)}</p>
                        <p className="text-xs text-slate-400">Inscripción #{p.inscripcionId}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">{money(p.monto)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{methodLabel(p.metodo)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-500">{p.transactionCode ?? "—"}</td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {p.estado === "APPROVED" && (
                          <Button onClick={() => setSelected(p)} variant="ghost" size="sm" icon={<Receipt size={14} />}>
                            Comprobante
                          </Button>
                        )}
                        {p.estado === "PENDING" && (
                          <Button
                            onClick={() => void verify(p)}
                            variant="secondary"
                            size="sm"
                            loading={checking === p.id}
                            icon={<RefreshCw size={14} />}
                          >
                            Verificar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comprobante */}
      {selected && (
        <div
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 font-display">Comprobante de pago</h3>
                <p className="text-xs text-slate-400">Pago #{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-sm flex flex-col gap-2 mb-5">
              {[
                ["Evento", eventName(selected)],
                ["Inscripción", `#${selected.inscripcionId}`],
                ["Fecha", formatDateTime(selected.createdAt)],
                ["Método", methodLabel(selected.metodo)],
                ["Operación", selected.transactionCode ?? "—"],
                ["Total", money(selected.monto)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-900 text-right">{v}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => printReceipt(selected, eventName(selected))} fullWidth icon={<Printer size={16} />}>
              Imprimir / guardar PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
