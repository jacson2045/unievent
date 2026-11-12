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
  pagoEstado: PaymentStatus | null;
  pagoMonto: number | null;
  pagoMetodo: string | null;
  pagoTransaccion: string | null;
  /** Solo llega al propio estudiante y solo si la inscripción está confirmada. */
  codigoAsistencia: string | null;
  fechaAsistencia: string | null;
}

export interface AttendanceResult {
  inscripcionId: number;
  eventoId: number;
  estudianteCorreo: string;
  fechaAsistencia: string;
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

export interface Payment {
  id: number;
  inscripcionId: number;
  eventoId: number;
  estadoInscripcion: EnrollmentStatus;
  monto: number;
  metodo: string | null;
  estado: PaymentStatus;
  transactionCode: string | null;
  createdAt: string;
}
