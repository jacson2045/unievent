package pe.edu.upeu.notificacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.notificacion.entity.EventoProcesado;

public interface EventoProcesadoRepository extends JpaRepository<EventoProcesado, String> {
}
