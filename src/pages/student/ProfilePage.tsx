import React, { useState } from "react";
import { User, Mail, Shield, Bell, Camera, Save } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Toggle } from "../../components/ui/Input";

export default function ProfilePage() {
  const [notifPrefs, setNotifPrefs] = useState({
    email: true, push: true, payments: true, reminders: true, news: false,
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Mi perfil</h2>
        <p className="text-sm text-slate-500">Gestiona tu información personal y preferencias.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold font-display">
              AR
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 shadow-sm">
              <Camera size={13} className="text-slate-600" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold font-display text-slate-900">Ana Lucía Ramírez Torres</h3>
              <Badge variant="student" />
            </div>
            <p className="text-sm text-slate-500">a.ramirez@uni.edu.pe</p>
            <p className="text-sm text-slate-500">Código: 20211234 · Ingeniería de Sistemas</p>
            <p className="text-xs text-slate-400 mt-1">Miembro desde marzo 2021</p>
          </div>
          <Button onClick={() => setEditing(!editing)} variant={editing ? "ghost" : "secondary"} size="sm">
            {editing ? "Cancelar" : "Editar perfil"}
          </Button>
        </div>
      </div>

      {/* Info form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-primary-600" />
          <h3 className="font-semibold text-slate-900 font-display">Información personal</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Nombre completo", value: "Ana Lucía Ramírez Torres" },
            { label: "Código universitario", value: "20211234" },
            { label: "Correo institucional", value: "a.ramirez@uni.edu.pe" },
            { label: "Teléfono", value: "+51 987 654 321" },
            { label: "Facultad", value: "Ingeniería de Sistemas" },
            { label: "Ciclo", value: "VIII Ciclo" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">{label}</label>
              {editing ? (
                <input
                  defaultValue={value}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-slate-900 px-3 py-2.5 bg-slate-50 rounded-xl">{value}</p>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <div className="mt-4 flex gap-3">
            <Button onClick={save} loading={saving} icon={<Save size={15} />}>Guardar cambios</Button>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-primary-600" />
          <h3 className="font-semibold text-slate-900 font-display">Seguridad</h3>
        </div>
        <div className="flex flex-col gap-3 max-w-sm">
          {["Contraseña actual", "Nueva contraseña", "Confirmar nueva contraseña"].map((l) => (
            <div key={l} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">{l}</label>
              <input type="password" placeholder="••••••••" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none" />
            </div>
          ))}
          <Button variant="secondary" className="mt-1 w-fit">Cambiar contraseña</Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-primary-600" />
          <h3 className="font-semibold text-slate-900 font-display">Preferencias de notificaciones</h3>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { key: "email", label: "Notificaciones por email", desc: "Recibe actualizaciones en tu correo institucional" },
            { key: "push", label: "Notificaciones push", desc: "Notificaciones en tiempo real en el navegador" },
            { key: "payments", label: "Actualizaciones de pago", desc: "Confirmaciones y estados de tus pagos" },
            { key: "reminders", label: "Recordatorios de eventos", desc: "Avisos 24h y 1h antes del evento" },
            { key: "news", label: "Novedades y promociones", desc: "Nuevos eventos y ofertas especiales" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Toggle
                checked={notifPrefs[key as keyof typeof notifPrefs]}
                onChange={(v) => setNotifPrefs(p => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
