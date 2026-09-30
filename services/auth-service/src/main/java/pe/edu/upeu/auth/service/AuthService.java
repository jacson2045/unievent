package pe.edu.upeu.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import pe.edu.upeu.auth.dto.AuthResponse;
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