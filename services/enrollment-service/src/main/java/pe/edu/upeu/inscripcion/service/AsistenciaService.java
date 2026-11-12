package pe.edu.upeu.inscripcion.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.inscripcion.dto.AsistenciaResponse;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;
import pe.edu.upeu.inscripcion.entity.CodigoAsistencia;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.repository.InscripcionRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;
import java.util.Set;

/**
 * Registro de asistencia (check-in) por parte del organizador del evento.
 * Reglas: el evento debe ser del organizador, la inscripción debe estar CONFIRMADA
 * y la asistencia se registra una sola vez.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AsistenciaService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InscripcionRepository inscripcionRepository;
    private final EventoConsultaService eventoConsultaService;

    /**
     * Si es true, solo se acepta el check-in desde 2 horas antes del inicio del evento.
     * En desarrollo queda en false para poder hacer la demo con eventos futuros.
     */
    @Value("${app.asistencia.validar-fecha:false}")
    private boolean validarFecha;

    @Transactional
    public AsistenciaResponse registrarPorCodigo(String authorization, String codigo, Long eventoEsperado) {
        Inscripcion inscripcion = inscripcionRepository
                .findByCodigoAsistencia(CodigoAsistencia.normalizar(codigo))
                .orElseThrow(() -> new NoSuchElementException("Código de asistencia no válido"));

        if (eventoEsperado != null && !eventoEsperado.equals(inscripcion.getEventoId())) {
            throw new IllegalStateException("Este código corresponde a otro evento");
        }
        return registrar(authorization, inscripcion);
    }

    @Transactional
    public AsistenciaResponse registrarPorInscripcion(String authorization, Long inscripcionId) {
        Inscripcion inscripcion = inscripcionRepository.findById(inscripcionId)
                .orElseThrow(() -> new NoSuchElementException("Inscripción no encontrada"));
        return registrar(authorization, inscripcion);
    }

    private AsistenciaResponse registrar(String authorization, Inscripcion inscripcion) {
        // Autorización a nivel de objeto: el evento debe ser del organizador que registra.
        Set<Long> misEventos = eventoConsultaService.idsEventosDelOrganizador(authorization);
        if (!misEventos.contains(inscripcion.getEventoId())) {
            throw new AccessDeniedException("Solo el organizador del evento puede registrar su asistencia");
        }

        if (!"CONFIRMADA".equals(inscripcion.getEstado())) {
            throw new IllegalStateException("La inscripción no está confirmada (estado: "
                    + inscripcion.getEstado().toLowerCase() + ")");
        }

        if (inscripcion.getFechaAsistencia() != null) {
            throw new IllegalStateException("La asistencia ya fue registrada el "
                    + inscripcion.getFechaAsistencia().format(HORA));
        }

        if (validarFecha) {
            validarVentanaDelEvento(inscripcion.getEventoId());
        }

        LocalDateTime ahora = LocalDateTime.now();
        int actualizadas = inscripcionRepository.registrarAsistencia(inscripcion.getId(), ahora);
        if (actualizadas == 0) {
            // Otro escaneo simultáneo del mismo QR ganó la carrera.
            throw new IllegalStateException("La asistencia ya fue registrada");
        }

        log.info("Asistencia registrada: inscripcion={} evento={} estudiante={}",
                inscripcion.getId(), inscripcion.getEventoId(), inscripcion.getEstudianteCorreo());

        return AsistenciaResponse.builder()
                .inscripcionId(inscripcion.getId())
                .eventoId(inscripcion.getEventoId())
                .estudianteCorreo(inscripcion.getEstudianteCorreo())
                .fechaAsistencia(ahora)
                .build();
    }

    private void validarVentanaDelEvento(Long eventoId) {
        EventoClienteResponse evento = eventoConsultaService.buscarEvento(eventoId)
                .orElseThrow(() -> new NoSuchElementException("El evento ya no existe"));
        if (evento.getFecha() != null && LocalDateTime.now().isBefore(evento.getFecha().minusHours(2))) {
            throw new IllegalStateException("El registro de asistencia abre 2 horas antes del inicio del evento");
        }
    }
}
