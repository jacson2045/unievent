import React, { useEffect, useState } from "react";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { getEventById } from "../../api/eventsApi";
import {
  createEnrollment,
  getPaymentStatus,
  startPayment,
} from "../../api/enrollmentApi";
import { HttpError } from "../../api/client";
import { getUser } from "../../utils/auth";
import type { BackendEvent } from "../../types/event";
import type { Enrollment, PaymentStatusResponse } from "../../types/enrollment";

interface Props {
  onNavigate: (p: string) => void;
  eventId: number | null;
}

type StepId = "data" | "confirm" | "payment" | "done";

const STEP_META: Record<StepId, { label: string; icon: React.ReactNode }> = {
  data: { label: "Datos", icon: <User size={16} /> },
  confirm: { label: "Confirmar", icon: <FileText size={16} /> },
  payment: { label: "Pago", icon: <CreditCard size={16} /> },
  done: { label: "Listo", icon: <CheckCircle size={16} /> },
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError || err instanceof Error) return err.message;
  return fallback;
}

export default function EnrollmentFlow({ onNavigate, eventId }: Props) {
  const user = getUser();

  const [ev, setEv] = useState<BackendEvent | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  const [step, setStep] = useState<StepId>("data");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let activo = true;

    if (eventId === null) {
      setEv(null);
      setEventError("No se seleccionó ningún evento.");
      setEventLoading(false);
      return () => {
        activo = false;
      };
    }

    setEventLoading(true);
    setEventError("");

    getEventById(eventId)
      .then((evento) => {
        if (activo) setEv(evento);
      })
      .catch((error: unknown) => {
        if (activo) setEventError(errorMessage(error, "No se pudo cargar el evento."));
      })
      .finally(() => {
        if (activo) setEventLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [eventId]);

  const precio = Number(ev?.precio ?? 0);
  const isFree = precio <= 0;
  const steps: StepId[] = isFree
    ? ["data", "confirm", "done"]
    : ["data", "confirm", "payment", "done"];
  const stepIndex = steps.indexOf(step);

  const fechaEvento = ev
    ? new Date(ev.fecha).toLocaleString("es-PE", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "";

  const goTo = (next: StepId) => {
    setActionError("");
    setInfo("");
    setStep(next);
  };

  /** Paso "Confirmar": crea la inscripción en enrollment-service. */
  const confirmEnrollment = async () => {
    if (!ev) return;
    setBusy(true);
    setActionError("");
    try {
      const created = await createEnrollment(ev.id);
      setEnrollment(created);
      if (created.estado === "CONFIRMADA") {
        goTo("done");
      } else {
        goTo("payment");
      }
    } catch (err) {
      setActionError(errorMessage(err, "No se pudo registrar la inscripción."));
    } finally {
      setBusy(false);
    }
  };

  /** Paso "Pago": pide la preferencia y redirige al checkout de Mercado Pago. */
  const goToCheckout = async () => {
    if (!enrollment) return;
    setBusy(true);
    setActionError("");
    try {
      const pref = await startPayment(enrollment.id);
      if (!pref.checkoutUrl) {
        throw new Error("Mercado Pago no devolvió una URL de pago.");
      }
      window.location.href = pref.checkoutUrl;
    } catch (err) {
      setActionError(errorMessage(err, "No se pudo iniciar el pago."));
      setBusy(false);
    }
  };

  /** Consulta manual del estado (por si el estudiante pagó en otra pestaña). */
  const verifyPayment = async () => {
    if (!enrollment) return;
    setBusy(true);
    setActionError("");
    setInfo("");
    try {
      const status = await getPaymentStatus(enrollment.id);
      setPayment(status);
      if (status.estado === "APPROVED") {
        setEnrollment({ ...enrollment, estado: "CONFIRMADA", requierePago: false });
        goTo("done");
      } else if (status.estado === "PENDING") {
        setInfo("Tu pago aún figura como pendiente. Si ya pagaste, espera unos segundos y vuelve a verificar.");
      } else {
        setActionError(
          "El pago fue rechazado o cancelado y la inscripción se anuló. Puedes volver a inscribirte.",
        );
        setEnrollment(null);
        setStep("confirm");
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) {
        setInfo("Todavía no iniciaste el pago. Usa el botón «Pagar con Mercado Pago».");
      } else {
        setActionError(errorMessage(err, "No se pudo verificar el pago."));
      }
    } finally {
      setBusy(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando evento...
      </div>
    );
  }

  if (eventError || !ev) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-red-600 mb-4">{eventError || "No se encontró el evento."}</p>
        <Button onClick={() => onNavigate("explore-events")}>Volver a eventos</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-0.5">
          Inscripción al evento
        </h2>
        <p className="text-sm text-slate-500">{ev.nombre}</p>
      </div>

      {/* Progreso */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex items-center">
          {steps.map((id, i) => (
            <React.Fragment key={id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={[
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    i < stepIndex
                      ? "bg-green-500 text-white"
                      : i === stepIndex
                        ? "bg-primary-600 text-white ring-4 ring-primary-100"
                        : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {i < stepIndex ? <Check size={16} /> : STEP_META[id].icon}
                </div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${i === stepIndex ? "text-primary-600" : i < stepIndex ? "text-green-600" : "text-slate-400"}`}
                >
                  {STEP_META[id].label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${i < stepIndex ? "bg-green-400" : "bg-slate-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Contenido del paso */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        {step === "data" && (
          <div>
            <h3 className="font-bold text-slate-900 font-display mb-4">Confirma tus datos</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Nombre completo", value: user?.nombreCompleto ?? "—" },
                { label: "Correo institucional", value: user?.correo ?? "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between py-2.5 border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 bg-slate-50 p-3 rounded-xl">
              La inscripción quedará registrada a nombre de esta cuenta.
            </p>
          </div>
        )}

        {step === "confirm" && (
          <div>
            <h3 className="font-bold text-slate-900 font-display mb-4">Confirma tu inscripción</h3>
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl mb-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-primary-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{ev.nombre}</p>
                  <p className="text-xs text-slate-500">{fechaEvento}</p>
                  <p className="text-xs text-slate-500">{ev.lugar}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Total a pagar</span>
              <span className="text-base font-bold text-primary-700">
                {isFree ? "Gratuito" : `S/ ${precio.toFixed(2)}`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isFree
                ? "Al confirmar, tu inscripción quedará registrada de inmediato."
                : "Al confirmar se reserva tu inscripción; quedará confirmada cuando se apruebe el pago."}
            </p>
          </div>
        )}

        {step === "payment" && (
          <div className="text-center">
            <h3 className="font-bold text-slate-900 font-display mb-2">Pago con Mercado Pago</h3>
            <p className="text-sm text-slate-500 mb-6">
              Serás redirigido al checkout seguro de Mercado Pago. Al terminar volverás
              automáticamente a UniEvent Pay.
            </p>
            <p className="text-3xl font-bold text-slate-900 font-display mb-1">
              S/ {precio.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Inscripción #{enrollment?.id} · pendiente de pago
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              Entorno de pruebas (sandbox): usa una tarjeta de prueba de Mercado Pago; no se cobra
              dinero real.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold font-display text-slate-900 mb-2">
              ¡Inscripción confirmada!
            </h3>
            <p className="text-slate-500 mb-6">
              Recibirás una notificación con la confirmación.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-left mb-6 flex flex-col gap-2">
              {[
                ["Inscripción", `#${enrollment?.id ?? "—"}`],
                ["Evento", ev.nombre],
                ["Fecha", fechaEvento],
                ["Monto", isFree ? "Gratuito" : `S/ ${precio.toFixed(2)}`],
                ...(payment?.transactionCode
                  ? [["Operación Mercado Pago", payment.transactionCode]]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => onNavigate("my-enrollments")} variant="secondary" fullWidth>
                Mis inscripciones
              </Button>
              <Button onClick={() => onNavigate("explore-events")} fullWidth>
                Más eventos
              </Button>
            </div>
          </div>
        )}

        {actionError && (
          <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}
        {info && (
          <div className="mt-5 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{info}</span>
          </div>
        )}
      </div>

      {/* Navegación */}
      {step === "data" && (
        <div className="flex gap-3">
          <Button onClick={() => onNavigate("event-detail")} variant="ghost" icon={<ArrowLeft size={16} />}>
            Atrás
          </Button>
          <Button onClick={() => goTo("confirm")} fullWidth iconRight={<ArrowRight size={16} />}>
            Continuar
          </Button>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex gap-3">
          <Button onClick={() => goTo("data")} variant="ghost" icon={<ArrowLeft size={16} />} disabled={busy}>
            Atrás
          </Button>
          <Button onClick={confirmEnrollment} loading={busy} fullWidth>
            {isFree ? "Confirmar inscripción" : "Confirmar y continuar al pago"}
          </Button>
        </div>
      )}

      {step === "payment" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={verifyPayment} variant="secondary" disabled={busy} icon={<RefreshCw size={16} />}>
            Ya pagué, verificar
          </Button>
          <Button onClick={goToCheckout} loading={busy} fullWidth iconRight={<ExternalLink size={16} />}>
            Pagar con Mercado Pago
          </Button>
        </div>
      )}
    </div>
  );
}
