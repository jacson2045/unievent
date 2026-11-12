import { api } from "./client";
import { getEvents } from "./eventsApi";
import type { BackendEvent } from "../types/event";
import type {
  Enrollment,
  Payment,
  PaymentPreference,
  PaymentStatusResponse,
} from "../types/enrollment";

const opts = { service: "gateway" as const, requiresAuth: true };

/** Crea la inscripción. Si ya existe una pendiente para el mismo evento, el backend la reutiliza. */
export function createEnrollment(eventoId: number): Promise<Enrollment> {
  return api.post<Enrollment>("/api/inscripciones", {
    ...opts,
    rawBody: { eventoId },
  });
}

export function getMyEnrollments(): Promise<Enrollment[]> {
  return api.get<Enrollment[]>("/api/inscripciones", opts);
}

export interface EnrollmentWithEvent {
  enrollment: Enrollment;
  /** null si el evento fue eliminado después de la inscripción. */
  event: BackendEvent | null;
}

/**
 * Inscripciones del estudiante unidas con los datos de su evento.
 * Se piden las dos listas en paralelo (una llamada a cada servicio) y se cruzan por eventoId.
 */
export async function getMyEnrollmentsWithEvents(): Promise<EnrollmentWithEvent[]> {
  const [enrollments, events] = await Promise.all([getMyEnrollments(), getEvents()]);
  const byId = new Map(events.map((e) => [e.id, e]));
  return enrollments
    .map((enrollment) => ({ enrollment, event: byId.get(enrollment.eventoId) ?? null }))
    .sort(
      (a, b) =>
        new Date(b.enrollment.fechaInscripcion).getTime() -
        new Date(a.enrollment.fechaInscripcion).getTime(),
    );
}

export function getEnrollment(id: number): Promise<Enrollment> {
  return api.get<Enrollment>(`/api/inscripciones/${id}`, opts);
}

/** Crea (o reutiliza) la preferencia de Mercado Pago y devuelve la URL del checkout. */
export function startPayment(inscripcionId: number): Promise<PaymentPreference> {
  return api.post<PaymentPreference>(`/api/inscripciones/${inscripcionId}/pago`, opts);
}

/** Consulta el estado del pago; el backend lo sincroniza con Mercado Pago. */
export function getPaymentStatus(
  inscripcionId: number,
): Promise<PaymentStatusResponse> {
  return api.get<PaymentStatusResponse>(
    `/api/inscripciones/${inscripcionId}/pago/estado`,
    opts,
  );
}

/** Historial de pagos del estudiante autenticado (el más reciente primero). */
export function getMyPayments(): Promise<Payment[]> {
  return api.get<Payment[]>("/api/inscripciones/pagos", opts);
}

/** Organizador: inscripciones (con su último pago) de sus eventos; opcionalmente de uno solo. */
export function getOrganizerEnrollments(eventoId?: number): Promise<Enrollment[]> {
  const query = eventoId ? `?eventoId=${eventoId}` : "";
  return api.get<Enrollment[]>(`/api/inscripciones/organizador${query}`, opts);
}
