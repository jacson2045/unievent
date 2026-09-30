import React, { useState } from "react";
import { Bell, CheckCircle, CreditCard, AlertTriangle, Calendar, XCircle, QrCode, BellOff } from "lucide-react";
import { notifications } from "../../data/mockData";

const typeIcon = {
  enrollment: <CheckCircle size={18} className="text-green-600" />,
  payment: <CreditCard size={18} className="text-primary-600" />,
  reminder: <Calendar size={18} className="text-violet-600" />,
  attendance: <QrCode size={18} className="text-sky-600" />,
  warning: <AlertTriangle size={18} className="text-amber-600" />,
  cancelled: <XCircle size={18} className="text-red-600" />,
};

const typeBg = {
  enrollment: "bg-green-50",
  payment: "bg-primary-50",
  reminder: "bg-violet-50",
  attendance: "bg-sky-50",
  warning: "bg-amber-50",
  cancelled: "bg-red-50",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notifications);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900">Notificaciones</h2>
          <p className="text-sm text-slate-500">{unread} sin leer</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {["Todas", "Sin leer", "Pagos"].map((tab) => (
          <button key={tab} className="px-4 h-8 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 first:bg-white first:shadow-sm transition-colors">
            {tab}
          </button>
        ))}
      </div>

      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <BellOff size={32} className="text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">Sin notificaciones</h3>
          <p className="text-sm text-slate-400">No tienes notificaciones nuevas por el momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.1)] ${n.read ? "bg-white border-slate-100" : "bg-primary-50/40 border-primary-100"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[n.type as keyof typeof typeBg] || "bg-slate-50"}`}>
                {typeIcon[n.type as keyof typeof typeIcon] || <Bell size={18} className="text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${n.read ? "text-slate-700" : "text-slate-900"}`}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
