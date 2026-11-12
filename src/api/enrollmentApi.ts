import { api } from "./client";
import type {
  Enrollment,
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
