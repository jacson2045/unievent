import React from "react";

type BadgeVariant = "active" | "pending" | "confirmed" | "rejected" | "cancelled" | "info" | "free" | "approved" | "degraded" | "online" | "offline" | "attended" | "student" | "organizer" | "admin" | "draft" | "inactive";

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  size?: "sm" | "md";
  dot?: boolean;
}

const styles: Record<BadgeVariant, string> = {
  active: "bg-green-50 text-green-700 ring-1 ring-green-200",
  online: "bg-green-50 text-green-700 ring-1 ring-green-200",
  confirmed: "bg-green-50 text-green-700 ring-1 ring-green-200",
  approved: "bg-green-50 text-green-700 ring-1 ring-green-200",
  attended: "bg-green-50 text-green-700 ring-1 ring-green-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  free: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  draft: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  inactive: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  offline: "bg-red-50 text-red-700 ring-1 ring-red-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  degraded: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  student: "bg-primary-50 text-primary-700 ring-1 ring-primary-200",
  organizer: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  admin: "bg-slate-800 text-white ring-0",
};

const dotColors: Record<BadgeVariant, string> = {
  active: "bg-green-500",
  online: "bg-green-500",
  confirmed: "bg-green-500",
  approved: "bg-green-500",
  attended: "bg-green-500",
  pending: "bg-amber-500",
  info: "bg-blue-500",
  free: "bg-blue-500",
  draft: "bg-slate-400",
  inactive: "bg-slate-400",
  rejected: "bg-red-500",
  offline: "bg-red-500",
  cancelled: "bg-red-500",
  degraded: "bg-amber-500",
  student: "bg-primary-500",
  organizer: "bg-violet-500",
  admin: "bg-white",
};

const labels: Partial<Record<BadgeVariant, string>> = {
  active: "Activo",
  online: "En línea",
  confirmed: "Confirmado",
  approved: "Aprobado",
  attended: "Asistió",
  pending: "Pendiente",
  info: "Info",
  free: "Gratuito",
  draft: "Borrador",
  inactive: "Inactivo",
  rejected: "Rechazado",
  offline: "Offline",
  cancelled: "Cancelado",
  degraded: "Degradado",
  student: "Estudiante",
  organizer: "Organizador",
  admin: "Admin",
};

export default function Badge({ variant = "info", children, size = "md", dot = false }: BadgeProps) {
  const display = children ?? labels[variant] ?? variant;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        styles[variant],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      ].join(" ")}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />}
      {display}
    </span>
  );
}
