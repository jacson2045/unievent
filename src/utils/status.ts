import type { EnrollmentStatus, PaymentStatus } from "../types/enrollment";

type BadgeVariant = "confirmed" | "pending" | "cancelled" | "approved" | "rejected" | "info" | "free";

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; variant: BadgeVariant }> = {
  CONFIRMADA: { label: "Confirmada", variant: "confirmed" },
  PENDIENTE: { label: "Pendiente de pago", variant: "pending" },
  CANCELADA: { label: "Cancelada", variant: "cancelled" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  APPROVED: { label: "Pago aprobado", variant: "approved" },
  PENDING: { label: "Pago pendiente", variant: "pending" },
  REJECTED: { label: "Pago rechazado", variant: "rejected" },
  CANCELLED: { label: "Pago cancelado", variant: "cancelled" },
  REFUNDED: { label: "Reembolsado", variant: "info" },
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatMoney(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return n > 0 ? `S/ ${n.toFixed(2)}` : "Gratuito";
}
