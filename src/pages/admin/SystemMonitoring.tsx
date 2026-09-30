import React from "react";
import { Activity, Cpu, HardDrive, Zap, AlertTriangle } from "lucide-react";
import { systemServices, kafkaTopics } from "../../data/mockData";

function MiniBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-600 w-8 text-right">{value}%</span>
    </div>
  );
}

export default function SystemMonitoring() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Monitoreo del sistema</h2>
        <p className="text-sm text-slate-500">Estado de los microservicios y Kafka en tiempo real (simulado).</p>
      </div>

      {/* Overall status */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Servicios online", value: "5/6", color: "text-green-600 bg-green-50" },
          { label: "Latencia promedio", value: "85ms", color: "text-primary-600 bg-primary-50" },
          { label: "Requests/hora", value: "35.6k", color: "text-violet-600 bg-violet-50" },
          { label: "Tasa de error", value: "0.21%", color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-2xl font-bold font-display">{value}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      <div>
        <h3 className="font-semibold text-slate-900 font-display mb-3">Microservicios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemServices.map((s) => (
            <div key={s.name} className={`bg-white rounded-2xl border p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] ${s.status === "degraded" ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${s.status === "online" ? "bg-green-500" : s.status === "degraded" ? "bg-amber-500" : "bg-red-500"}`} />
                  <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === "online" ? "bg-green-100 text-green-700" : s.status === "degraded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {s.status === "online" ? "ONLINE" : s.status === "degraded" ? "DEGRADADO" : "OFFLINE"}
                </span>
              </div>

              {s.status === "degraded" && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={12} />
                  Alta latencia detectada
                </div>
              )}

              <div className="flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Zap size={11} />Latencia</span>
                  <span className={`font-mono font-semibold ${s.latency > 100 ? "text-amber-600" : "text-slate-800"}`}>{s.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Requests/hora</span>
                  <span className="font-mono font-semibold text-slate-800">{s.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errores</span>
                  <span className={`font-mono font-semibold ${s.errors > 0 ? "text-red-600" : "text-green-600"}`}>{s.errors}</span>
                </div>
                <div className="mt-1">
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1"><Cpu size={11} />CPU</span>
                  </div>
                  <MiniBar value={s.cpu} color={s.cpu > 70 ? "bg-amber-400" : "bg-primary-500"} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1"><HardDrive size={11} />Memoria</span>
                  </div>
                  <MiniBar value={s.memory} color={s.memory > 75 ? "bg-amber-400" : "bg-violet-500"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kafka */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-slate-900 font-display">Kafka — Topics y mensajes</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">ONLINE</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Topic", "Mensajes procesados", "Consumer Lag", "Consumidores", "Estado"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kafkaTopics.map((t) => (
                  <tr key={t.topic} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <code className="text-sm font-mono text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{t.topic}</code>
                    </td>
                    <td className="px-5 py-4 text-sm font-mono font-semibold text-slate-900">{t.messages.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-mono font-semibold ${t.lag > 5 ? "text-amber-600" : "text-green-600"}`}>
                        {t.lag}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{t.consumers}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${t.lag > 5 ? "bg-amber-400" : "bg-green-500"}`} />
                        <span className={`text-xs font-semibold ${t.lag > 5 ? "text-amber-600" : "text-green-600"}`}>
                          {t.lag > 5 ? "Lag alto" : "Normal"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Observability stack */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <h3 className="font-semibold font-display mb-3">Stack de observabilidad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Prometheus", desc: "Métricas del sistema", status: "ok" },
            { name: "Grafana", desc: "Dashboards visuales", status: "ok" },
            { name: "Loki", desc: "Agregación de logs", status: "ok" },
            { name: "Kafka UI", desc: "Monitor de topics", status: "ok" },
          ].map(({ name, desc, status }) => (
            <div key={name} className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-semibold">{name}</span>
              </div>
              <p className="text-xs text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
