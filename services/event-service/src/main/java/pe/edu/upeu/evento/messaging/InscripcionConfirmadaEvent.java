package pe.edu.upeu.evento.messaging;

import java.math.BigDecimal;

/**
 * Contrato del evento "inscripcion confirmada" publicado por enrollment-service.
 * Debe mantener los mismos nombres de campos que el productor.
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
}
