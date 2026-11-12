export interface EventCategory {
  id: number;
  nombre: string;
  descripcion: string;
}

export type EventModality = "PRESENCIAL" | "VIRTUAL" | "HIBRIDO";

export interface BackendEvent {
  id: number;
  nombre: string;
  descripcion: string | null;
  descripcionCorta: string | null;
  fecha: string;
  fechaFin: string | null;
  lugar: string;
  capacidad: number;
  inscritos: number;
  cuposDisponibles: number;
  precio: number;
  estado: string;
  modalidad: EventModality | null;
  organizador: string | null;
  requisitos: string | null;
  tags: string[];
  imagenUrl: string | null;
  categoria: EventCategory | null;
}

export const MODALITY_LABELS: Record<EventModality, string> = {
  PRESENCIAL: "Presencial",
  VIRTUAL: "Virtual",
  HIBRIDO: "Híbrido",
};
