
package pe.edu.upeu.inscripcion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.inscripcion.entity.Pago;

import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    Optional<Pago> findTopByInscripcionIdOrderByIdDesc(Long inscripcionId);

    boolean existsByInscripcionIdAndEstado(Long inscripcionId, String estado);

    /** Historial de pagos de un estudiante, el más reciente primero (una sola consulta). */
    @org.springframework.data.jpa.repository.Query(
            "SELECT p FROM Pago p JOIN FETCH p.inscripcion i "
            + "WHERE i.estudianteCorreo = :correo ORDER BY p.createdAt DESC, p.id DESC")
    java.util.List<Pago> findHistorialPorEstudiante(String correo);
}
