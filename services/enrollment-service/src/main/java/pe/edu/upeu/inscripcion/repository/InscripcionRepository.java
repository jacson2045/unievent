package pe.edu.upeu.inscripcion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.inscripcion.entity.Inscripcion;

import java.util.List;


public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    long countByEventoIdAndEstado(Long eventoId, String estado);

    List<Inscripcion> findByEstudianteCorreo(String estudianteCorreo);

    java.util.Optional<Inscripcion> findByCodigoAsistencia(String codigoAsistencia);

    /**
     * Registra la asistencia solo si aún no estaba registrada. Al ser una única sentencia
     * condicional, dos escaneos simultáneos del mismo QR no pueden registrarla dos veces.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
            "UPDATE Inscripcion i SET i.fechaAsistencia = :fecha "
            + "WHERE i.id = :id AND i.fechaAsistencia IS NULL AND i.estado = 'CONFIRMADA'")
    int registrarAsistencia(Long id, java.time.LocalDateTime fecha);

    List<Inscripcion> findByEventoIdInOrderByFechaInscripcionDesc(java.util.Collection<Long> eventoIds);

    boolean existsByEstudianteCorreoAndEventoIdAndEstadoNot(
        String estudianteCorreo, Long eventoId, String estado);

    /** Inscripción vigente (no cancelada) del estudiante en el evento, si existe. */
    java.util.Optional<Inscripcion> findFirstByEstudianteCorreoAndEventoIdAndEstadoNot(
        String estudianteCorreo, Long eventoId, String estado);
}
