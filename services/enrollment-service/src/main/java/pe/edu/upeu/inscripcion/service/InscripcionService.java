package pe.edu.upeu.inscripcion.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;
import pe.edu.upeu.inscripcion.dto.InscripcionRequest;
import pe.edu.upeu.inscripcion.dto.InscripcionResponse;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.repository.InscripcionRepository;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class InscripcionService {

    private final InscripcionRepository inscripcionRepository;
    private final EventoConsultaService eventoConsultaService;

    public InscripcionResponse crear(InscripcionRequest request, String estudianteCorreo) {
        EventoClienteResponse evento = eventoConsultaService.buscarEvento(request.getEventoId())
                .orElseThrow(() -> new NoSuchElementException("El evento no existe"));

        if (!"ACTIVO".equals(evento.getEstado())) {
            throw new IllegalStateException("El evento no estÃ¡ activo");
        }

        long inscritos = inscripcionRepository.countByEventoIdAndEstado(request.getEventoId(), "CONFIRMADA");
        if (inscritos >= evento.getCapacidad()) {
            throw new IllegalStateException("No hay cupos disponibles para este evento");
        }

        Inscripcion inscripcion = Inscripcion.builder()
                .estudianteCorreo(estudianteCorreo)
                .eventoId(request.getEventoId())
                .estado("PENDIENTE")
                .build();

        Inscripcion guardada = inscripcionRepository.save(inscripcion);
        return toResponse(guardada);
    }

    public InscripcionResponse obtenerPorId(Long id, String estudianteCorreo) {
        Inscripcion inscripcion = inscripcionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("InscripciÃ³n no encontrada"));

        if (!inscripcion.getEstudianteCorreo().equals(estudianteCorreo)) {
            throw new IllegalStateException("No puedes ver inscripciones de otro estudiante");
        }

        return toResponse(inscripcion);
    }

    private InscripcionResponse toResponse(Inscripcion inscripcion) {
        return InscripcionResponse.builder()
                .id(inscripcion.getId())
                .estudianteCorreo(inscripcion.getEstudianteCorreo())
                .eventoId(inscripcion.getEventoId())
                .estado(inscripcion.getEstado())
                .fechaInscripcion(inscripcion.getFechaInscripcion())
                .build();
    }
}
