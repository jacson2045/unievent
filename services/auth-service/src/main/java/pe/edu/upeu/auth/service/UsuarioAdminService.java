package pe.edu.upeu.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.auth.dto.PerfilResponse;
import pe.edu.upeu.auth.entity.Usuario;
import pe.edu.upeu.auth.exception.SolicitudInvalidaException;
import pe.edu.upeu.auth.repository.UsuarioRepository;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/** Gestión de usuarios para el rol ADMIN. */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsuarioAdminService {

    private static final Set<String> ROLES = Set.of("ESTUDIANTE", "ORGANIZADOR", "ADMIN");

    private final UsuarioRepository usuarioRepository;

    public List<PerfilResponse> listar() {
        return usuarioRepository.findAllByOrderByCreadoEnDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PerfilResponse cambiarEstado(Long id, boolean activo, String adminCorreo) {
        Usuario usuario = buscar(id);
        if (usuario.getCorreo().equalsIgnoreCase(adminCorreo) && !activo) {
            throw new SolicitudInvalidaException("No puedes desactivar tu propia cuenta");
        }
        usuario.setActivo(activo);
        log.info("ADMIN {} {} la cuenta {}", adminCorreo, activo ? "activó" : "desactivó", usuario.getCorreo());
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public PerfilResponse cambiarRol(Long id, String rol, String adminCorreo) {
        String nuevoRol = rol == null ? "" : rol.trim().toUpperCase();
        if (!ROLES.contains(nuevoRol)) {
            throw new SolicitudInvalidaException("Rol no válido: usa ESTUDIANTE, ORGANIZADOR o ADMIN");
        }
        Usuario usuario = buscar(id);
        if (usuario.getCorreo().equalsIgnoreCase(adminCorreo) && !"ADMIN".equals(nuevoRol)) {
            throw new SolicitudInvalidaException("No puedes quitarte a ti mismo el rol de administrador");
        }
        usuario.setRol(nuevoRol);
        log.info("ADMIN {} cambió el rol de {} a {}", adminCorreo, usuario.getCorreo(), nuevoRol);
        return toResponse(usuarioRepository.save(usuario));
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
    }

    private PerfilResponse toResponse(Usuario u) {
        return PerfilResponse.builder()
                .id(u.getId())
                .nombreCompleto(u.getNombreCompleto())
                .correo(u.getCorreo())
                .rol(u.getRol())
                .activo(u.getActivo())
                .creadoEn(u.getCreadoEn())
                .build();
    }
}
