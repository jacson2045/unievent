import React, { useCallback, useEffect, useState } from "react";
import { Activity, BarChart3, CheckCircle, ExternalLink, Gauge, HelpCircle, MessageSquare, RefreshCw, XCircle } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { MONITORED_SERVICES, getServiceHealth, type HealthComponent, type ServiceHealth } from "../../api/adminApi";

const REFRESH_MS = 15000;

/** Herramientas de observabilidad que levanta infra/docker-compose.yml. */
const TOOLS = [
  { label: "Grafana", url: "http://localhost:3000", desc: "Paneles de métricas", icon: <BarChart3 size={18} /> },
  { label: "Prometheus", url: "http://localhost:9090/targets", desc: "Recolección de métricas", icon: <Gauge size={18} /> },
  { label: "Kafka UI", url: "http://localhost:8085", desc: "Tópicos y mensajes", icon: <MessageSquare size={18} /> },
];

const COMPONENT_LABELS: Record<string, string> = {
  db: "Base de datos",
  diskSpace: "Disco",
  ping: "Ping",
  ssl: "SSL",
  circuitBreakers: "Circuit breakers",
  refreshScope: "Refresh scope",
  configServer: "Config Server",
  clientConfigServer: "Config Server",
  kafka: "Kafka",
  livenessState: "Liveness",
  readinessState: "Readiness",
  discoveryComposite: "Service discovery",
};

function componentDetail(name: string, c: HealthComponent): string | null {
  const d = c.details ?? {};
  if (name === "db" && typeof d.database === "string") return d.database;
  if (name === "diskSpace" && typeof d.free === "number") return `${(Number(d.free) / 1024 ** 3).toFixed(1)} GB libres`;
  if (name === "circuitBreakers" && d && typeof d === "object") {
    const states = Object.entries(d)
      .map(([k, v]) => `${k}: ${(v as { details?: { state?: string } })?.details?.state ?? "?"}`)
      .join(", ");
    return states || null;
  }
  return null;
}

export default function SystemMonitoring() {
  const [health, setHealth] = useState<Record<string, ServiceHealth>>({});
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(MONITORED_SERVICES.map((s) => getServiceHealth(s.id)));
    setHealth(Object.fromEntries(results.map((r) => [r.id, r])));
    setCheckedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    void check();
    const t = window.setInterval(() => void check(), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [check]);

  const list = Object.values(health);
  const up = list.filter((h) => h.status === "UP").length;
  const allUp = list.length > 0 && up === list.length;

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Monitoreo del sistema</h2>
          <p className="text-sm text-slate-500">
            Health checks reales de cada microservicio consultados a través del API Gateway · se actualiza cada{" "}
            {REFRESH_MS / 1000} s
          </p>
        </div>
        <Button onClick={() => void check()} variant="ghost" size="sm" icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}>
          Verificar ahora
        </Button>
      </div>

      <div
        className={`rounded-2xl p-5 flex items-center gap-4 border ${
          list.length === 0 ? "bg-slate-50 border-slate-100" : allUp ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        {allUp ? <CheckCircle className="text-green-600" size={28} /> : <Activity className={list.length ? "text-red-600" : "text-slate-400"} size={28} />}
        <div>
          <p className="font-semibold text-slate-900">
            {list.length === 0 ? "Verificando servicios..." : allUp ? "Todos los servicios operativos" : `${list.length - up} servicio(s) con problemas`}
          </p>
          <p className="text-sm text-slate-500">
            {up} de {MONITORED_SERVICES.length} servicios en línea · API Gateway en línea (responde esta consulta)
            {checkedAt && ` · última verificación ${checkedAt.toLocaleTimeString("es-PE")}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MONITORED_SERVICES.map((s) => {
          const h = health[s.id];
          const components = Object.entries(h?.components ?? {});
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
                {!h ? (
                  <Badge variant="pending">Verificando</Badge>
                ) : h.status === "UP" ? (
                  <Badge variant="online" dot>En línea</Badge>
                ) : (
                  <Badge variant="offline" dot>Caído</Badge>
                )}
              </div>
              <div className="flex gap-4 text-xs text-slate-500 mb-3">
                <span>Puerto {s.port}</span>
                {h?.latencyMs != null && <span>Respuesta {h.latencyMs} ms</span>}
              </div>
              {h?.error && <p className="text-xs text-red-600 mb-2">{h.error}</p>}
              {components.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  {components.map(([name, c]) => {
                    const detail = componentDetail(name, c);
                    return (
                      <div key={name} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          {c.status === "UP" ? (
                            <CheckCircle size={12} className="text-green-500" />
                          ) : c.status === "UNKNOWN" ? (
                            <HelpCircle size={12} className="text-slate-400" />
                          ) : (
                            <XCircle size={12} className="text-red-500" />
                          )}
                          {COMPONENT_LABELS[name] ?? name}
                        </span>
                        <span className="text-slate-400 truncate">{detail ?? c.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-5">
        <h3 className="font-semibold text-slate-900 font-display mb-3">Herramientas de observabilidad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOOLS.map((t) => (
            <a
              key={t.label}
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">{t.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">{t.label}</span>
                <span className="block text-xs text-slate-500">{t.desc}</span>
              </span>
              <ExternalLink size={14} className="text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
