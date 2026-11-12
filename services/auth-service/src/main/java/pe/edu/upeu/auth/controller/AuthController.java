package pe.edu.upeu.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import pe.edu.upeu.auth.dto.ActualizarPerfilRequest;
import pe.edu.upeu.auth.dto.AuthResponse;
import pe.edu.upeu.auth.dto.CambiarPasswordRequest;
import pe.edu.upeu.auth.dto.PerfilResponse;
import pe.edu.upeu.auth.dto.LoginRequest;
import pe.edu.upeu.auth.dto.RegistroRequest;
import pe.edu.upeu.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/registro")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Perfil del usuario autenticado (el correo sale del JWT, no de la URL). */
    @GetMapping("/perfil")
    public ResponseEntity<PerfilResponse> perfil(Authentication authentication) {
        return ResponseEntity.ok(authService.perfil(authentication.getName()));
    }

    @PutMapping("/perfil")
    public ResponseEntity<PerfilResponse> actualizarPerfil(@Valid @RequestBody ActualizarPerfilRequest request,
                                                           Authentication authentication) {
        return ResponseEntity.ok(authService.actualizarPerfil(authentication.getName(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request,
                                                Authentication authentication) {
        authService.cambiarPassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}