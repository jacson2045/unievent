export interface EventCategory {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface BackendEvent {
  id: number;
  nombre: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  capacidad: number;
  precio: number;
  estado: string;
  categoria: EventCategory;
}