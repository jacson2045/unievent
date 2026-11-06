package pe.edu.upeu.notificacion.dto;

import java.time.LocalDateTime;

public record NotificacionResponse(
        Long id,
        String tipo,
        String titulo,
        String mensaje,
        Long inscripcionId,
        Long eventoId,
        boolean leida,
        LocalDateTime creadaEn
) {
}
