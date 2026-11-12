package pe.edu.upeu.inscripcion.messaging;

import java.math.BigDecimal;

/**
 * Contrato de los eventos de inscripcion (tipo INSCRIPCION_CONFIRMADA o INSCRIPCION_CANCELADA).
 * El consumidor (notification-service) define el mismo record: mantener nombres de campos iguales.
 */
public record InscripcionConfirmadaEvent(
        String eventId,
        String tipo,
        String ocurridoEn,
        Long inscripcionId,
        Long pagoId,
        Long eventoId,
        String estudianteCorreo,
        BigDecimal monto,
        /** Nombre del evento (opcional; null en mensajes antiguos). */
        String eventoNombre
) {
    public static final String TOPIC = "unievent.inscripciones";
    /** Compensacion: inscripcion anulada por pago rechazado o cancelado. */
    public static final String TIPO_CANCELADA = "INSCRIPCION_CANCELADA";
    public static final String TIPO = "INSCRIPCION_CONFIRMADA";
}
