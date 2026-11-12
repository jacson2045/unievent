import React, { useEffect, useState } from "react";
import { Bell, CheckCircle, BellOff, RefreshCw, XCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  type AppNotification,
} from "../../api/notificationsApi";

interface Props {
  /** Avisa a la app que cambió el número de no leídas (para el contador del menú). */
  onUnreadChange?: (count: number) => void;
}

const TYPE_STYLE: Record<string, { icon: React.ReactNode; bg: string }> = {
  INSCRIPCION_CONFIRMADA: { icon: <CheckCircle size={18} className="text-green-600" />, bg: "bg-green-50" },
  INSCRIPCION_CANCELADA: { icon: <XCircle size={18} className="text-red-600" />, bg: "bg-red-50" },
};

function timeAgo(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60000);
  if (Number.isNaN(min)) return value;
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `Hace ${d} día${d === 1 ? "" : "s"}`;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsPage({ onUnreadChange }: Props) {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifs.filter((n) => !n.leida).length;

  useEffect(() => {
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setNotifs(await getNotifications());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (n: AppNotification) => {
    if (n.leida) return;
    // Actualización optimista: se marca al instante y se revierte si falla.
    setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    try {
      await markAsRead(n.id);
    } catch {
      setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, leida: false } : x)));
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifs((list) => list.map((x) => ({ ...x, leida: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron marcar como leídas.");
    } finally {
      setMarkingAll(false);
    }
  };

  const visible = tab === "unread" ? notifs.filter((n) => !n.leida) : notifs;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Notificaciones</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Cargando..." : `${unread} sin leer`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void load()} variant="ghost" size="sm" icon={<RefreshCw size={14} />} disabled={loading}>
            Actualizar
          </Button>
          {unread > 0 && (
            <Button onClick={() => void markAll()} variant="secondary" size="sm" loading={markingAll}>
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: "all" as const, label: "Todas" },
          { id: "unread" as const, label: `Sin leer${unread ? ` (${unread})` : ""}` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 h-8 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <BellOff size={32} className="text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">
            {tab === "unread" ? "Todo al día" : "Sin notificaciones"}
          </h3>
          <p className="text-sm text-slate-400">
            {tab === "unread"
              ? "No tienes notificaciones pendientes de leer."
              : "Aquí verás la confirmación de tus inscripciones y pagos."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((n) => {
            const style = TYPE_STYLE[n.tipo] ?? { icon: <Bell size={18} className="text-slate-500" />, bg: "bg-slate-50" };
            return (
              <button
                key={n.id}
                onClick={() => void markRead(n)}
                className={`text-left flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.1)] ${
                  n.leida ? "bg-white border-slate-100 cursor-default" : "bg-primary-50/40 border-primary-100 cursor-pointer"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.leida ? "text-slate-700" : "text-slate-900"}`}>{n.titulo}</p>
                    {!n.leida && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.mensaje}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{timeAgo(n.creadaEn)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
