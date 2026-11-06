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

        String monto = evento.monto() == null ? "0.00" : evento.monto().toPlainString();

        notificacionRepository.save(Notificacion.builder()
                .destinatarioCorreo(evento.estudianteCorreo())
                .tipo(evento.tipo())
                .titulo("Inscripción confirmada")
                .mensaje("Tu inscripción #" + evento.inscripcionId()
                        + " al evento #" + evento.eventoId()
                        + " fue confirmada. Pago registrado por S/ " + monto + ".")
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

    private NotificacionResponse toResponse(Notificacion n) {
        return new NotificacionResponse(
                n.getId(), n.getTipo(), n.getTitulo(), n.getMensaje(),
                n.getInscripcionId(), n.getEventoId(), n.isLeida(), n.getCreadaEn());
    }
}
