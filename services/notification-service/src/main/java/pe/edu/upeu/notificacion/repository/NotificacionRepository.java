package pe.edu.upeu.notificacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.notificacion.entity.Notificacion;

import java.util.List;
import java.util.Optional;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findByDestinatarioCorreoOrderByCreadaEnDesc(String destinatarioCorreo);

    Optional<Notificacion> findByIdAndDestinatarioCorreo(Long id, String destinatarioCorreo);
}
