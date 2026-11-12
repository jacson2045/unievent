package pe.edu.upeu.inscripcion.messaging;

import java.math.BigDecimal;

/**
 * Contrato del evento "inscripcion confirmada".
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
    public static final String TIPO = "INSCRIPCION_CONFIRMADA";
}
