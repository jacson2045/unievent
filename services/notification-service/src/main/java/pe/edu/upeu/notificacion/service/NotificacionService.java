package pe.edu.upeu.notificacion.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.notificacion.dto.NotificacionResponse;
import pe.edu.upeu.notificacion.entity.EventoProcesado;
import pe.edu.upeu.notificacion.entity.Notificacion;
import pe.edu.upeu.notificacion.messaging.InscripcionConfirmadaEvent;
import pe.edu.upeu.notificacion.repository.EventoProcesadoRepository;
import pe.edu.upeu.notificacion.repository.NotificacionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final EventoProcesadoRepository eventoProcesadoRepository;

    /**
     * Procesa un evento una sola vez.
     *
     * @return true si se creo la notificacion; false si el evento ya habia sido procesado.
     */
    @Transactional
    public boolean procesar(InscripcionConfirmadaEvent evento) {

        if (eventoProcesadoRepository.existsById(evento.eventId())) {
            return false;
        }

        // La clave primaria protege tambien frente a dos consumidores simultaneos.
        eventoProcesadoRepository.saveAndFlush(
                new EventoProcesado(evento.eventId(), evento.tipo(), LocalDateTime.now()));

        if (InscripcionConfirmadaEvent.TIPO_CANCELADA.equals(evento.tipo())) {
            notificacionRepository.save(Notificacion.builder()
                    .destinatarioCorreo(evento.estudianteCorreo())
                    .tipo(evento.tipo())
                    .titulo("Pago no completado: inscripción anulada")
                    .mensaje("El pago de tu inscripción #" + evento.inscripcionId()
                            + " a " + nombreEvento(evento)
                            + " fue rechazado o cancelado, por lo que la inscripción se anuló."
                            + " Puedes volver a inscribirte desde el evento.")
                    .inscripcionId(evento.inscripcionId())
                    .eventoId(evento.eventoId())
                    .build());
            return true;
        }

        boolean gratuito = evento.monto() == null || evento.monto().signum() <= 0;
        String detallePago = gratuito
                ? "Evento gratuito, no requiere pago."
                : "Pago registrado por S/ " + evento.monto().toPlainString() + ".";

        notificacionRepository.save(Notificacion.builder()
                .destinatarioCorreo(evento.estudianteCorreo())
                .tipo(evento.tipo())
                .titulo("Inscripción confirmada")
                .mensaje("Tu inscripción #" + evento.inscripcionId()
                        + " a " + nombreEvento(evento)
                        + " fue confirmada. " + detallePago)
                .inscripcionId(evento.inscripcionId())
                .eventoId(evento.eventoId())
                .build());

        return true;
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listar(String correo) {
        return notificacionRepository
                .findByDestinatarioCorreoOrderByCreadaEnDesc(correo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificacionResponse marcarLeida(Long id, String correo) {
        Notificacion notificacion = notificacionRepository
                .findByIdAndDestinatarioCorreo(id, correo)
                .orElseThrow(() -> new NoSuchElementException("Notificación no encontrada"));

        notificacion.setLeida(true);
        return toResponse(notificacionRepository.save(notificacion));
    }

    /** Marca como leídas todas las notificaciones del usuario; devuelve cuántas cambiaron. */
    @Transactional
    public int marcarTodasLeidas(String correo) {
        return notificacionRepository.marcarTodasLeidas(correo);
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(String correo) {
        return notificacionRepository.countByDestinatarioCorreoAndLeidaFalse(correo);
    }

    private String nombreEvento(InscripcionConfirmadaEvent evento) {
        return evento.eventoNombre() != null && !evento.eventoNombre().isBlank()
                ? "«" + evento.eventoNombre() + "»"
                : "el evento #" + evento.eventoId();
    }

    private NotificacionResponse toResponse(Notificacion n) {
        return new NotificacionResponse(
                n.getId(), n.getTipo(), n.getTitulo(), n.getMensaje(),
                n.getInscripcionId(), n.getEventoId(), n.isLeida(), n.getCreadaEn());
    }
}
