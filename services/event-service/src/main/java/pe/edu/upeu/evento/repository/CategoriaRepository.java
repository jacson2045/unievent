package pe.edu.upeu.evento.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.evento.entity.Categoria;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
}