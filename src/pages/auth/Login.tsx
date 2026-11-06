
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Zap,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Button from "../../components/ui/Button";
import { login } from "../../api/authApi";
import { HttpError } from "../../api/client";
import type { Role } from "../../utils/auth";

interface LoginProps {
  onLogin: (role: Role) => void;
  onRegister: () => void;
  onForgot: () => void;
}

export default function Login({
  onLogin,
  onRegister,
  onForgot,
}: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const validationErrors: typeof errors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      validationErrors.email = "El correo electrónico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      validationErrors.email = "Ingresa un correo electrónico válido";
    }

    if (!password) {
      validationErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      validationErrors.password =
        "La contraseña debe tener al menos 6 caracteres";
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Autenticación real contra auth-service.
      const user = await login({
        correo: email.trim(),
        password,
      });

      // Solo se permite entrar después de una autenticación correcta.
      onLogin(user.rol);
    } catch (err) {
      let message = "No se pudo iniciar sesión. Inténtalo de nuevo.";

      if (err instanceof HttpError) {
        if (err.status === 0) {
          message =
            "No se pudo conectar con el servidor. Comprueba que auth-service esté activo y que la API sea accesible.";
        } else if (err.status === 401 || err.status === 403) {
          message = "Correo o contraseña incorrectos, o acceso no autorizado.";
        } else {
          message = err.message || `Error del servidor: ${err.status}`;
        }
      }

      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex app-bg">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 max-w-lg mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>

            <div>
              <p className="font-bold text-slate-900 font-display text-lg leading-tight">
                UniEvent Pay
              </p>
              <p className="text-xs text-slate-400">
                Plataforma universitaria
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 mb-6 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            Plataforma de eventos universitarios
          </div>

          <h1 className="text-3xl font-bold text-slate-900 font-display mb-2">
            Bienvenido de vuelta
          </h1>

          <p className="text-slate-500">
            Ingresa con tu cuenta institucional para continuar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          {errors.form && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    email: undefined,
                    form: undefined,
                  }));
                }}
                placeholder="tu.nombre@uni.edu.pe"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full h-11 pl-9 pr-3 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 ${
                  errors.email
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                }`}
              />
            </div>

            {errors.email && (
              <p
                id="email-error"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="login-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    password: undefined,
                    form: undefined,
                  }));
                }}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`w-full h-11 pl-9 pr-10 rounded-xl border text-sm outline-none transition-all bg-white text-slate-900 placeholder:text-slate-400 ${
                  errors.password
                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPw((visible) => !visible)}
                aria-label={
                  showPw ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.password && (
              <p
                id="password-error"
                className="text-xs text-red-600 flex items-center gap-1"
              >
                <AlertCircle size={12} />
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">Recordarme</span>
            </label>

            <button
              type="button"
              onClick={onForgot}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            icon={<ArrowRight size={18} />}
            iconRight={undefined}
          >
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onRegister}
            className="text-primary-600 hover:text-primary-800 font-semibold"
          >
            Crear cuenta
          </button>
        </p>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-violet-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-300" />
        </div>

        <div className="relative flex flex-col justify-center items-center p-16 text-white text-center">
          <div className="mb-8 grid grid-cols-2 gap-4 w-full max-w-xs">
            {[
              { label: "Eventos universitarios", value: "UniEvent" },
              { label: "Acceso", value: "Seguro" },
              { label: "Inscripciones", value: "En línea" },
              { label: "Pagos", value: "Integrados" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"
              >
                <p className="text-xl font-bold font-display">
                  {item.value}
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-bold font-display mb-3">
            Gestiona tus eventos universitarios
          </h2>

          <p className="text-white/70 text-base leading-relaxed">
            Inscripciones, pagos y asistencias en una sola plataforma
            diseñada para la comunidad universitaria.
          </p>
        </div>
      </div>
    </div>
  );
}
