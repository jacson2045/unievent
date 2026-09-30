package pe.edu.upeu.inscripcion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.inscripcion.entity.Inscripcion;

import java.util.List;

public interface InscripcionRepository extends JpaRepository<Inscripcion, Long> {
    long countByEventoIdAndEstado(Long eventoId, String estado);
    List<Inscripcion> findByEstudianteCorreo(String estudianteCorreo);
}