import React, { useState } from "react";
import { Check, ArrowRight, ArrowLeft, User, FileText, CreditCard, CheckCircle, QrCode } from "lucide-react";
import Button from "../../components/ui/Button";
import { events } from "../../data/mockData";

interface Props { onNavigate: (p: string) => void }

const STEPS = [
  { label: "Datos", icon: <User size={16} /> },
  { label: "Confirmar", icon: <FileText size={16} /> },
  { label: "Pago", icon: <CreditCard size={16} /> },
  { label: "Verificación", icon: <QrCode size={16} /> },
  { label: "Listo", icon: <CheckCircle size={16} /> },
];

const METHODS = [
  { id: "yape", label: "Yape", color: "from-purple-600 to-purple-800", desc: "Pago con QR" },
  { id: "plin", label: "Plin", color: "from-green-500 to-teal-600", desc: "Pago con QR" },
  { id: "bcp", label: "BCP", color: "from-blue-600 to-blue-800", desc: "Transferencia bancaria" },
  { id: "card", label: "Tarjeta", color: "from-slate-700 to-slate-900", desc: "Visa / Mastercard" },
];

export default function EnrollmentFlow({ onNavigate }: Props) {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("yape");
  const [loading, setLoading] = useState(false);
  const ev = events[0];

  const next = async () => {
    if (step === 3) {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setLoading(false);
    }
    setStep(s => Math.min(s + 1, 4));
  };
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 mb-0.5">Inscripción al evento</h2>
        <p className="text-sm text-slate-500">{ev.title}</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1">
                <div className={[
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  i < step ? "bg-green-500 text-white" : i === step ? "bg-primary-600 text-white ring-4 ring-primary-100" : "bg-slate-100 text-slate-400",
                ].join(" ")}>
                  {i < step ? <Check size={16} /> : s.icon}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? "text-primary-600" : i < step ? "text-green-600" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < step ? "bg-green-400" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]">
        {step === 0 && (
          <div>
            <h3 className="font-bold text-slate-900 font-display mb-4">Confirma tus datos</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: "Nombre completo", value: "Ana Lucía Ramírez Torres" },
                { label: "Correo institucional", value: "a.ramirez@uni.edu.pe" },
                { label: "Código universitario", value: "20211234" },
                { label: "Facultad", value: "Ingeniería de Sistemas" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 bg-slate-50 p-3 rounded-xl">Si tus datos no son correctos, actualízalos en tu perfil antes de continuar.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="font-bold text-slate-900 font-display mb-4">Confirma tu inscripción</h3>
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl mb-4">
              <div className="flex gap-4">
                <img src={ev.image} alt={ev.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{ev.title}</p>
                  <p className="text-xs text-slate-500">{ev.date} · {ev.time}</p>
                  <p className="text-xs text-slate-500">{ev.location}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: "Precio base", value: `S/ ${ev.price.toFixed(2)}` },
                { label: "Descuento estudiante (10%)", value: "-S/ 4.50", cls: "text-green-600" },
                { label: "Total a pagar", value: "S/ 40.50", cls: "text-primary-700 font-bold text-base" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold ${cls || "text-slate-900"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-bold text-slate-900 font-display mb-4">Selecciona método de pago</h3>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4">
              ⚠ Pago simulado para fines académicos — no se procesa dinero real.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${method === m.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-2`}>
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                  {method === m.id && <div className="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h3 className="font-bold text-slate-900 font-display mb-2">Escanea el código QR</h3>
            <p className="text-sm text-slate-500 mb-6">Usa tu app {method === "yape" ? "Yape" : method === "plin" ? "Plin" : "bancaria"} para pagar</p>
            <div className="w-48 h-48 bg-slate-900 rounded-2xl mx-auto mb-4 flex items-center justify-center relative">
              <div className="grid grid-cols-7 grid-rows-7 gap-0.5 p-3">
                {Array.from({ length: 49 }).map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? "bg-white" : "bg-transparent"}`} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <QrCode size={24} className="text-slate-900" />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-sm text-slate-600 mb-4">
              <span className="text-2xl font-bold text-slate-900 font-display">S/ 40.50</span>
              <span className="text-xs text-slate-400">Código de operación: OPR-2026-084729</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-xs text-amber-700 inline-flex items-center gap-2">
              <Clock size={12} />
              Expira en 14:32
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold font-display text-slate-900 mb-2">¡Inscripción confirmada!</h3>
            <p className="text-slate-500 mb-2">Tu inscripción al evento fue registrada exitosamente.</p>
            <p className="text-xs text-slate-400 font-mono mb-6">TXN-2026-084729 · {new Date().toLocaleDateString("es-PE")}</p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-left mb-6 flex flex-col gap-2">
              {[
                ["Evento", ev.title],
                ["Fecha", ev.date],
                ["Monto", "S/ 40.50"],
                ["Método", METHODS.find(m => m.id === method)?.label ?? ""],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button onClick={() => onNavigate("my-enrollments")} variant="secondary" fullWidth>Mis inscripciones</Button>
              <Button onClick={() => onNavigate("explore-events")} fullWidth>Más eventos</Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex gap-3">
          {step > 0 && (
            <Button onClick={back} variant="ghost" icon={<ArrowLeft size={16} />}>Atrás</Button>
          )}
          <Button onClick={next} loading={loading} fullWidth iconRight={step < 3 ? <ArrowRight size={16} /> : undefined}>
            {step === 3 ? "Ya realicé el pago" : step === 4 ? "Finalizar" : "Continuar"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Clock({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
