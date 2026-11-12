package pe.edu.upeu.inscripcion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;
import pe.edu.upeu.inscripcion.dto.InscripcionRequest;
import pe.edu.upeu.inscripcion.dto.InscripcionResponse;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.messaging.InscripcionEventPublisher;
import pe.edu.upeu.inscripcion.repository.InscripcionRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InscripcionService {

    private final InscripcionRepository inscripcionRepository;
    private final EventoConsultaService eventoConsultaService;
    private final InscripcionEventPublisher eventPublisher;

    /**
     * Crea la inscripción de forma idempotente:
     * - Si el estudiante ya tiene una inscripción PENDIENTE en el evento, se devuelve esa
     *   misma (por ejemplo, abandonó el checkout y vuelve a intentarlo).
     * - Si ya está CONFIRMADA, se rechaza.
     * - Si el evento es gratuito, la inscripción queda CONFIRMADA de inmediato y se publica
     *   el evento de negocio en Kafka.
     */
    @Transactional
    public InscripcionResponse crear(
            InscripcionRequest request,
            String estudianteCorreo) {

        EventoClienteResponse evento = eventoConsultaService
                .buscarEvento(request.getEventoId())
                .orElseThrow(() ->
                        new NoSuchElementException("El evento no existe"));

        if (!"ACTIVO".equals(evento.getEstado())) {
            throw new IllegalStateException(
                    "El evento no está activo");
        }

        if (evento.getFecha() != null
                && evento.getFecha().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException(
                    "El evento ya se realizó; las inscripciones están cerradas");
        }

        // Una inscripción CANCELADA (pago rechazado) no bloquea el reintento.
        Optional<Inscripcion> vigente = inscripcionRepository
                .findFirstByEstudianteCorreoAndEventoIdAndEstadoNot(
                        estudianteCorreo, request.getEventoId(), "CANCELADA");

        if (vigente.isPresent()) {
            Inscripcion existente = vigente.get();
            if ("PENDIENTE".equals(existente.getEstado())) {
                log.info("Inscripción {} ya existente y pendiente: se reutiliza", existente.getId());
                return toResponse(existente);
            }
            throw new IllegalStateException(
                    "Ya estás inscrito en este evento");
        }

        long inscritos = inscripcionRepository
                .countByEventoIdAndEstado(
                        request.getEventoId(), "CONFIRMADA");

        if (inscritos >= evento.getCapacidad()) {
            throw new IllegalStateException(
                    "No hay cupos disponibles para este evento");
        }

        boolean gratuito = evento.esGratuito();

        Inscripcion inscripcion = Inscripcion.builder()
                .estudianteCorreo(estudianteCorreo)
                .eventoId(request.getEventoId())
                .estado(gratuito ? "CONFIRMADA" : "PENDIENTE")
                .build();

        Inscripcion guardada;
        try {
            // El índice parcial V5 protege frente a dos solicitudes simultáneas.
            guardada = inscripcionRepository.saveAndFlush(inscripcion);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException(
                    "Ya estás inscrito en este evento");
        }

        if (gratuito) {
            log.info("Evento {} gratuito: inscripción {} confirmada sin pago",
                    evento.getId(), guardada.getId());
            eventPublisher.publicarInscripcionConfirmada(guardada, null);
        }

        return toResponse(guardada);
    }

    public List<InscripcionResponse> listarPorEstudiante(
            String estudianteCorreo) {

        return inscripcionRepository
                .findByEstudianteCorreo(estudianteCorreo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public InscripcionResponse obtenerPorId(
            Long id,
            String estudianteCorreo) {

        Inscripcion inscripcion = inscripcionRepository.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Inscripción no encontrada"));

        if (!inscripcion.getEstudianteCorreo()
                .equals(estudianteCorreo)) {
            throw new IllegalStateException(
                    "No puedes ver inscripciones de otro estudiante");
        }

        return toResponse(inscripcion);
    }

    private InscripcionResponse toResponse(Inscripcion inscripcion) {
        return InscripcionResponse.builder()
                .id(inscripcion.getId())
                .estudianteCorreo(inscripcion.getEstudianteCorreo())
                .eventoId(inscripcion.getEventoId())
                .estado(inscripcion.getEstado())
                // Los eventos gratuitos se confirman al crearse, así que una
                // inscripción PENDIENTE siempre corresponde a un evento con costo.
                .requierePago("PENDIENTE".equals(inscripcion.getEstado()))
                .fechaInscripcion(inscripcion.getFechaInscripcion())
                .build();
    }
}
