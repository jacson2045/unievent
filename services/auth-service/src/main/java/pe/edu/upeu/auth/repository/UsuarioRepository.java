package pe.edu.upeu.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.auth.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreo(String correo);
    boolean existsByCorreo(String correo);
}