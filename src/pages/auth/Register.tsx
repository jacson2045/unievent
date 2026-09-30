import React, { useState } from "react";
import { Zap, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { register } from "../../api/authApi";
import { HttpError } from "../../api/client";
import type { Role } from "../../utils/auth";

interface RegisterProps {
  onLogin: (role?: Role) => void;
  onBack: () => void;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "Al menos 8 caracteres", ok: password.length >= 8 },
    { label: "Una letra mayúscula", ok: /[A-Z]/.test(password) },
    { label: "Un número", ok: /[0-9]/.test(password) },
    { label: "Un carácter especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const bars = ["bg-red-400", "bg-amber-400", "bg-yellow-400", "bg-green-400", "bg-green-500"];
  const labels = ["", "Débil", "Regular", "Buena", "Fuerte"];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bars[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs mb-2 ${score < 2 ? "text-red-500" : score < 3 ? "text-amber-500" : "text-green-600"}`}>
        {labels[score]}
      </p>
      <div className="flex flex-col gap-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-slate-300" />}
            <span className={c.ok ? "text-green-700" : "text-slate-400"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Register({ onLogin, onBack }: RegisterProps) {
  const [form, setForm] = useState({
    fullName: "", email: "", code: "", password: "", confirm: "", role: "student" as Role, terms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.fullName) errs.fullName = "El nombre completo es requerido";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Correo institucional inválido";
    if (form.password.length < 8) errs.password = "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirm) errs.confirm = "Las contraseñas no coinciden";
    if (!form.terms) errs.terms = "Debes aceptar los términos y condiciones";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError(null);

    try {
      const user = await register({
        nombreCompleto: form.fullName,
        correo: form.email,
        password: form.password,
        rol: form.role,
      });
      onLogin(user.rol);
    } catch (err) {
      const msg = err instanceof HttpError
        ? err.status === 0
          ? "No se pudo conectar con el servidor. Verifica que auth-service esté corriendo en el puerto 8082."
          : err.message
        : "Ocurrió un error al crear la cuenta.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder, icon, required = true }: { label: string; name: string; type?: string; placeholder?: string; icon?: React.ReactNode; required?: boolean }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}{!required && <span className="text-slate-400 font-normal"> (opcional)</span>}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type={type}
          value={form[name as keyof typeof form] as string}
          onChange={set(name)}
          placeholder={placeholder}
          className={`w-full h-10 ${icon ? "pl-9" : "pl-3"} pr-3 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 ${errors[name] ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"}`}
        />
      </div>
      {errors[name] && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex w-80 flex-shrink-0 bg-gradient-to-b from-primary-600 to-violet-700 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-white font-display text-lg">UniEvent Pay</span>
        </div>
        <div className="text-white">
          <p className="text-3xl font-bold font-display mb-3">Únete a la comunidad</p>
          <p className="text-white/70">Accede a los mejores eventos universitarios, gestiona tus inscripciones y pagos desde un solo lugar.</p>
        </div>
        <div className="text-white/50 text-xs">© 2026 UniEvent Pay · Todos los derechos reservados</div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full">
          <div className="mb-8">
            <button onClick={onBack} className="text-sm text-primary-600 hover:text-primary-800 font-medium mb-6 block">← Volver al inicio</button>
            <h1 className="text-2xl font-bold font-display text-slate-900 mb-1">Crear cuenta</h1>
            <p className="text-slate-500 text-sm">Completa tu información para registrarte en la plataforma.</p>
          </div>

          {serverError && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Nombre completo" name="fullName" placeholder="Ana Lucía Ramírez Torres" />
            <Field label="Correo institucional" name="email" type="email" placeholder="ana.ramirez@uni.edu.pe" />
            <Field label="Código universitario" name="code" placeholder="20211234" required={false} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  className={`w-full h-10 pl-3 pr-10 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 ${errors.password ? "border-red-400" : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"}`}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{errors.password}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="••••••••"
                  className={`w-full h-10 pl-3 pr-10 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 ${errors.confirm ? "border-red-400" : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-600 flex items-center gap-1"><XCircle size={12} />Las contraseñas no coinciden</p>
              )}
              {form.confirm && form.confirm === form.password && form.confirm.length >= 8 && (
                <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} />Las contraseñas coinciden</p>
              )}
              {errors.confirm && <p className="text-xs text-red-600">{errors.confirm}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tipo de cuenta</label>
              <select
                value={form.role}
                onChange={set("role")}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                <option value="student">Estudiante</option>
                <option value="organizer">Organizador</option>
              </select>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={set("terms")}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary-600"
              />
              <span className="text-sm text-slate-600">
                Acepto los{" "}
                <span className="text-primary-600 font-medium">Términos y Condiciones</span> y la{" "}
                <span className="text-primary-600 font-medium">Política de Privacidad</span> de UniEvent Pay.
              </span>
            </label>
            {errors.terms && <p className="text-xs text-red-600 -mt-2">{errors.terms}</p>}

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <button onClick={() => onLogin()} className="text-primary-600 font-semibold hover:text-primary-800">Iniciar sesión</button>
          </p>
        </div>
      </div>
    </div>
  );
}
