package pe.edu.upeu.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.upeu.auth.dto.ActualizarPerfilRequest;
import pe.edu.upeu.auth.dto.AuthResponse;
import pe.edu.upeu.auth.dto.CambiarPasswordRequest;
import pe.edu.upeu.auth.dto.PerfilResponse;
import pe.edu.upeu.auth.exception.SolicitudInvalidaException;
import pe.edu.upeu.auth.dto.LoginRequest;
import pe.edu.upeu.auth.dto.RegistroRequest;
import pe.edu.upeu.auth.entity.Usuario;
import pe.edu.upeu.auth.repository.UsuarioRepository;
import pe.edu.upeu.auth.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse registrar(RegistroRequest request) {
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalStateException("Ya existe un usuario con ese correo");
        }

        Usuario usuario = Usuario.builder()
                .nombreCompleto(request.getNombreCompleto())
                .correo(request.getCorreo())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(request.getRol())
                .activo(true)
                .build();

        usuarioRepository.save(usuario);

        String token = jwtService.generarToken(usuario.getCorreo(), usuario.getRol());
        return AuthResponse.builder()
                .token(token)
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .build();
    }

    public PerfilResponse perfil(String correo) {
        return toPerfil(buscar(correo));
    }

    @org.springframework.transaction.annotation.Transactional
    public PerfilResponse actualizarPerfil(String correo, ActualizarPerfilRequest request) {
        Usuario usuario = buscar(correo);
        usuario.setNombreCompleto(request.getNombreCompleto().trim());
        return toPerfil(usuarioRepository.save(usuario));
    }

    @org.springframework.transaction.annotation.Transactional
    public void cambiarPassword(String correo, CambiarPasswordRequest request) {
        Usuario usuario = buscar(correo);
        if (!passwordEncoder.matches(request.getActual(), usuario.getPassword())) {
            throw new SolicitudInvalidaException("La contraseña actual no es correcta");
        }
        if (passwordEncoder.matches(request.getNueva(), usuario.getPassword())) {
            throw new SolicitudInvalidaException("La nueva contraseña debe ser distinta de la actual");
        }
        usuario.setPassword(passwordEncoder.encode(request.getNueva()));
        usuarioRepository.save(usuario);
    }

    private Usuario buscar(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new java.util.NoSuchElementException("Usuario no encontrado"));
    }

    private PerfilResponse toPerfil(Usuario u) {
        return PerfilResponse.builder()
                .id(u.getId())
                .nombreCompleto(u.getNombreCompleto())
                .correo(u.getCorreo())
                .rol(u.getRol())
                .activo(u.getActivo())
                .creadoEn(u.getCreadoEn())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new IllegalArgumentException("Correo o contraseña incorrectos"));

        if (!usuario.getActivo()) {
            throw new IllegalStateException("El usuario está desactivado");
        }

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        String token = jwtService.generarToken(usuario.getCorreo(), usuario.getRol());
        return AuthResponse.builder()
                .token(token)
                .nombreCompleto(usuario.getNombreCompleto())
                .correo(usuario.getCorreo())
                .rol(usuario.getRol())
                .build();
    }
}