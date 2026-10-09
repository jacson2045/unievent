package pe.edu.upeu.inscripcion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.inscripcion.entity.Pago;

import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    Optional<Pago> findTopByInscripcionIdOrderByIdDesc(Long inscripcionId);
}