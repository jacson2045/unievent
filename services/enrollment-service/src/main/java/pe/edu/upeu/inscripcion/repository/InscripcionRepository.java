package pe.edu.upeu.inscripcion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.inscripcion.entity.Inscripcion;

import java.util.List;


public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    long countByEventoIdAndEstado(Long eventoId, String estado);

    List<Inscripcion> findByEstudianteCorreo(String estudianteCorreo);

    List<Inscripcion> findByEventoIdInOrderByFechaInscripcionDesc(java.util.Collection<Long> eventoIds);

    boolean existsByEstudianteCorreoAndEventoIdAndEstadoNot(
        String estudianteCorreo, Long eventoId, String estado);

    /** Inscripción vigente (no cancelada) del estudiante en el evento, si existe. */
    java.util.Optional<Inscripcion> findFirstByEstudianteCorreoAndEventoIdAndEstadoNot(
        String estudianteCorreo, Long eventoId, String estado);
}
