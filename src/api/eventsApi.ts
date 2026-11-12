import { api } from "./client";
import type { BackendEvent, EventCategory, EventPayload } from "../types/event";

export async function getEvents(): Promise<BackendEvent[]> {
  const result = await api.get<BackendEvent[]>("/api/eventos", {
    service: "gateway",
  });

  if (!Array.isArray(result)) {
    throw new Error("El servidor no devolvió una lista válida de eventos.");
  }

  return result;
}

export async function getEventById(id: number): Promise<BackendEvent> {
  return api.get<BackendEvent>(`/api/eventos/${id}`, {
    service: "gateway",
  });
}

const authOpts = { service: "gateway" as const, requiresAuth: true };

export function getCategories(): Promise<EventCategory[]> {
  return api.get<EventCategory[]>("/api/categorias", { service: "gateway" });
}

/** Eventos creados por el organizador autenticado (un administrador ve todos). */
export function getMyEvents(): Promise<BackendEvent[]> {
  return api.get<BackendEvent[]>("/api/eventos/mis-eventos", authOpts);
}

export function createEvent(payload: EventPayload): Promise<BackendEvent> {
  return api.post<BackendEvent>("/api/eventos", { ...authOpts, rawBody: payload });
}

export function updateEvent(id: number, payload: EventPayload): Promise<BackendEvent> {
  return api.put<BackendEvent>(`/api/eventos/${id}`, { ...authOpts, rawBody: payload });
}

/** Deja de aceptar inscripciones pero conserva el historial. */
export function cancelEvent(id: number): Promise<BackendEvent> {
  return api.put<BackendEvent>(`/api/eventos/${id}/cancelar`, authOpts);
}

/** Solo funciona si el evento no tiene inscritos. */
export function deleteEvent(id: number): Promise<void> {
  return api.delete<void>(`/api/eventos/${id}`, authOpts);
}
