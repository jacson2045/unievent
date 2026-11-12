package pe.edu.upeu.evento.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.evento.entity.EventoProcesado;

public interface EventoProcesadoRepository extends JpaRepository<EventoProcesado, String> {
}
