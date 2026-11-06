package pe.edu.upeu.notificacion.messaging;

import java.math.BigDecimal;

/**
 * Contrato del evento publicado por enrollment-service.
 * Debe mantenerse igual en ambos servicios (mismos nombres de campos).
 */
public record InscripcionConfirmadaEvent(
        String eventId,
        String tipo,
        String ocurridoEn,
        Long inscripcionId,
        Long pagoId,
        Long eventoId,
        String estudianteCorreo,
        BigDecimal monto
) {
    public static final String TOPIC = "unievent.inscripciones";
    public static final String TIPO = "INSCRIPCION_CONFIRMADA";
}
