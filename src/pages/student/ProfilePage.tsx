import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail, RefreshCw, Save, Shield, User } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { changePassword, getProfile, updateProfile, type Profile } from "../../api/authApi";
import { mapRolBackendToFrontend, updateStoredName } from "../../utils/auth";

interface Props {
  /** Avisa a la app el nuevo nombre para actualizar el encabezado. */
  onNameChange?: (name: string) => void;
}

const ROLE_LABEL = { student: "Estudiante", organizer: "Organizador", admin: "Administrador" } as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

type Msg = { ok: boolean; text: string } | null;

export default function ProfilePage({ onNameChange }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<Msg>(null);

  const [pw, setPw] = useState({ actual: "", nueva: "", confirmar: "" });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const p = await getProfile();
      setProfile(p);
      setName(p.nombreCompleto);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveName = async () => {
    const clean = name.trim();
    if (clean.length < 3) {
      setNameMsg({ ok: false, text: "El nombre debe tener al menos 3 caracteres." });
      return;
    }
    setSavingName(true);
    setNameMsg(null);
    try {
      const p = await updateProfile(clean);
      setProfile(p);
      setEditing(false);
      updateStoredName(p.nombreCompleto);
      onNameChange?.(p.nombreCompleto);
      setNameMsg({ ok: true, text: "Tus datos se actualizaron." });
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (!pw.actual || !pw.nueva) {
      setPwMsg({ ok: false, text: "Completa la contraseña actual y la nueva." });
      return;
    }
    if (pw.nueva.length < 8) {
      setPwMsg({ ok: false, text: "La nueva contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (pw.nueva !== pw.confirmar) {
      setPwMsg({ ok: false, text: "La confirmación no coincide con la nueva contraseña." });
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(pw.actual, pw.nueva);
      setPw({ actual: "", nueva: "", confirmar: "" });
      setPwMsg({ ok: true, text: "Contraseña actualizada. Úsala la próxima vez que inicies sesión." });
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "No se pudo cambiar la contraseña." });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-600">
        <RefreshCw className="animate-spin mx-auto mb-3 text-primary-600" size={28} />
        Cargando tu perfil...
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-3xl bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
        <p className="font-semibold mb-1">No se pudo cargar tu perfil</p>
        <p className="mb-4">{loadError}</p>
        <Button onClick={() => void load()} variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
          Reintentar
        </Button>
      </div>
    );
  }

  const role = mapRolBackendToFrontend(profile.rol);
  const memberSince = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(new Date(profile.creadoEn));

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900">Mi perfil</h2>
        <p className="text-sm text-slate-500">Gestiona tu información personal y tu contraseña.</p>
      </div>

      {/* Tarjeta */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold font-display">
            {initials(profile.nombreCompleto)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-bold font-display text-slate-900">{profile.nombreCompleto}</h3>
              <Badge variant={role}>{ROLE_LABEL[role]}</Badge>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Mail size={13} /> {profile.correo}
            </p>
            <p className="text-xs text-slate-400 mt-1">Miembro desde {memberSince}</p>
          </div>
          <Button
            onClick={() => {
              setEditing(!editing);
              setName(profile.nombreCompleto);
              setNameMsg(null);
            }}
            variant={editing ? "ghost" : "secondary"}
            size="sm"
          >
            {editing ? "Cancelar" : "Editar perfil"}
          </Button>
        </div>
      </div>

      {/* Información */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-primary-600" />
          <h3 className="font-semibold text-slate-900 font-display">Información personal</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500" htmlFor="perfil-nombre">
              Nombre completo
            </label>
            {editing ? (
              <input
                id="perfil-nombre"
                value={name}
                maxLength={150}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            ) : (
              <p className="text-sm font-medium text-slate-900 px-3 py-2.5 bg-slate-50 rounded-xl">{profile.nombreCompleto}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Correo institucional</span>
            <p className="text-sm font-medium text-slate-500 px-3 py-2.5 bg-slate-50 rounded-xl" title="El correo identifica tu cuenta y no se puede cambiar">
              {profile.correo}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Rol</span>
            <p className="text-sm font-medium text-slate-900 px-3 py-2.5 bg-slate-50 rounded-xl">{ROLE_LABEL[role]}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Estado de la cuenta</span>
            <p className="text-sm font-medium text-slate-900 px-3 py-2.5 bg-slate-50 rounded-xl">
              {profile.activo ? "Activa" : "Desactivada"}
            </p>
          </div>
        </div>
        {editing && (
          <div className="mt-4">
            <Button onClick={() => void saveName()} loading={savingName} icon={<Save size={15} />}>
              Guardar cambios
            </Button>
          </div>
        )}
        {nameMsg && <Message msg={nameMsg} />}
      </div>

      {/* Seguridad */}
      <form onSubmit={savePassword} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_0_rgb(0_0_0/0.08)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary-600" />
            <h3 className="font-semibold text-slate-900 font-display">Cambiar contraseña</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className="flex flex-col gap-3 max-w-sm">
          {(
            [
              ["actual", "Contraseña actual", "current-password"],
              ["nueva", "Nueva contraseña (mínimo 8 caracteres)", "new-password"],
              ["confirmar", "Confirmar nueva contraseña", "new-password"],
            ] as const
          ).map(([key, label, autoComplete]) => (
            <label key={key} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <input
                type={showPw ? "text" : "password"}
                autoComplete={autoComplete}
                value={pw[key]}
                onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </label>
          ))}
          <Button type="submit" variant="secondary" className="mt-1 w-fit" loading={savingPw}>
            Cambiar contraseña
          </Button>
        </div>
        {pwMsg && <Message msg={pwMsg} />}
      </form>
    </div>
  );
}

function Message({ msg }: { msg: { ok: boolean; text: string } }) {
  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm border ${
        msg.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {msg.ok ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
      <span>{msg.text}</span>
    </div>
  );
}
