import { api } from "./client";
import type { BackendEvent } from "../types/event";

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
  const events = await getEvents();
  const event = events.find((item) => item.id === id);

  if (!event) {
    throw new Error("No se encontró el evento seleccionado.");
  }

  return event;
}