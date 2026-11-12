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
        BigDecimal monto,
        /** Nombre del evento (opcional; null en mensajes antiguos). */
        String eventoNombre
) {
    /** Compatibilidad con mensajes publicados antes de agregar eventoNombre. */
    public InscripcionConfirmadaEvent(String eventId, String tipo, String ocurridoEn, Long inscripcionId,
                                      Long pagoId, Long eventoId, String estudianteCorreo, BigDecimal monto) {
        this(eventId, tipo, ocurridoEn, inscripcionId, pagoId, eventoId, estudianteCorreo, monto, null);
    }

    public static final String TOPIC = "unievent.inscripciones";
    /** Compensacion: inscripcion anulada por pago rechazado o cancelado. */
    public static final String TIPO_CANCELADA = "INSCRIPCION_CANCELADA";
    public static final String TIPO = "INSCRIPCION_CONFIRMADA";
}
