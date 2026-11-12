import { api } from "./client";

export interface AppNotification {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  inscripcionId: number | null;
  eventoId: number | null;
  leida: boolean;
  creadaEn: string;
}

const opts = { service: "gateway" as const, requiresAuth: true };

export function getNotifications(): Promise<AppNotification[]> {
  return api.get<AppNotification[]>("/api/notificaciones", opts);
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<{ total: number }>("/api/notificaciones/no-leidas", opts);
  return res.total;
}

export function markAsRead(id: number): Promise<AppNotification> {
  return api.put<AppNotification>(`/api/notificaciones/${id}/leida`, opts);
}

export function markAllAsRead(): Promise<{ actualizadas: number }> {
  return api.put<{ actualizadas: number }>("/api/notificaciones/leidas", opts);
}
