import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { getEnrollment, getPaymentStatus } from "../../api/enrollmentApi";
import { getEventById } from "../../api/eventsApi";
import { HttpError } from "../../api/client";
import type { PaymentStatusResponse } from "../../types/enrollment";

interface Props {
  onNavigate: (page: string) => void;
}

/** Mercado Pago puede tardar unos segundos en registrar el pago: se reintenta unas veces. */
const MAX_ATTEMPTS = 4;
const RETRY_MS = 2500;

function readInscripcionId(): number | null {
  const raw = new URLSearchParams(window.location.search).get("inscripcionId");
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function PaymentResult({ onNavigate }: Props) {
  const [inscripcionId] = useState<number | null>(readInscripcionId);
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [eventName, setEventName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    if (inscripcionId === null) {
      setError("No se indicó la inscripción a verificar.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      let result = await getPaymentStatus(inscripcionId);
      for (let i = 1; i < MAX_ATTEMPTS && result.estado === "PENDING"; i++) {
        await new Promise((r) => setTimeout(r, RETRY_MS));
        result = await getPaymentStatus(inscripcionId);
      }
      setStatus(result);
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 404
          ? "No encontramos un pago para esta inscripción."
          : err instanceof Error
            ? err.message
            : "No se pudo verificar el pago.",
      );
    } finally {
      setLoading(false);
    }
  }, [inscripcionId]);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    if (inscripcionId === null) return;
    getEnrollment(inscripcionId)
      .then((e) => getEventById(e.eventoId))
      .then((ev) => setEventName(ev.nombre))
      .catch(() => undefined);
  }, [inscripcionId]);

  const leave = (page: string) => {
    // Limpia los parámetros que agrega Mercado Pago a la URL.
    window.history.replaceState(null, "", window.location.pathname);
    onNavigate(page);
  };

  let icon: React.ReactNode;
  let title: string;
  let message: string;

  if (loading) {
    icon = <RefreshCw size={40} className="text-primary-600 animate-spin" />;
    title = "Verificando tu pago...";
    message = "Estamos confirmando el resultado con Mercado Pago.";
  } else if (error || !status) {
    icon = <AlertCircle size={40} className="text-red-600" />;
    title = "No se pudo verificar el pago";
    message = error || "Intenta nuevamente en unos segundos.";
  } else if (status.estado === "APPROVED") {
    icon = <CheckCircle size={40} className="text-green-600" />;
    title = "¡Pago aprobado!";
    message = "Tu inscripción quedó confirmada. Recibirás una notificación.";
  } else if (status.estado === "PENDING") {
    icon = <Clock size={40} className="text-amber-500" />;
    title = "Pago pendiente";
    message =
      "Mercado Pago aún no confirma tu pago. Puedes verificar de nuevo en unos momentos.";
  } else {
    icon = <XCircle size={40} className="text-red-600" />;
    title = "Pago no completado";
    message =
      "El pago fue rechazado o cancelado y la inscripción se anuló. Puedes volver a inscribirte desde el evento.";
  }

  const bg =
    loading || status?.estado === "PENDING"
      ? "bg-amber-50"
      : status?.estado === "APPROVED"
        ? "bg-green-100"
        : "bg-red-50";

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] text-center">
        <div className={`w-20 h-20 ${bg} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-500 mb-6">{message}</p>

        {status && !loading && (
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-left mb-6 flex flex-col gap-2">
            {[
              ["Inscripción", `#${status.inscripcionId}`],
              ...(eventName ? [["Evento", eventName]] : []),
              ["Monto", `S/ ${Number(status.monto).toFixed(2)}`],
              ...(status.metodo ? [["Método", status.metodo]] : []),
              ...(status.transactionCode ? [["Operación", status.transactionCode]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-900 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {!loading && status?.estado !== "APPROVED" && inscripcionId !== null && (
            <Button onClick={() => void check()} variant="secondary" fullWidth icon={<RefreshCw size={16} />}>
              Verificar de nuevo
            </Button>
          )}
          <Button onClick={() => leave("my-enrollments")} fullWidth disabled={loading}>
            Ir a mis inscripciones
          </Button>
        </div>
      </div>
    </div>
  );
}
