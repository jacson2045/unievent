package pe.edu.upeu.evento.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pe.edu.upeu.evento.entity.Evento;

import java.util.List;
import java.util.Optional;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    @Query("SELECT e FROM Evento e JOIN FETCH e.categoria")
    List<Evento> findAllConCategoria();

    @Query("SELECT e FROM Evento e JOIN FETCH e.categoria WHERE e.id = :id")
    Optional<Evento> findByIdConCategoria(Long id);
}