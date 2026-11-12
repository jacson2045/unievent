export type EnrollmentStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

export type PaymentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REFUNDED";

export interface Enrollment {
  id: number;
  estudianteCorreo: string;
  eventoId: number;
  estado: EnrollmentStatus;
  requierePago: boolean;
  fechaInscripcion: string;
}

export interface PaymentPreference {
  pagoId: number;
  monto: number;
  estado: PaymentStatus;
  checkoutUrl: string;
}

export interface PaymentStatusResponse {
  pagoId: number;
  inscripcionId: number;
  estado: PaymentStatus;
  estadoInscripcion: EnrollmentStatus;
  monto: number;
  metodo: string | null;
  transactionCode: string | null;
}
