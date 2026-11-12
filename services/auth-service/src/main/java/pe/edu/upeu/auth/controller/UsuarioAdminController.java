package pe.edu.upeu.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.auth.dto.PerfilResponse;
import pe.edu.upeu.auth.service.UsuarioAdminService;

import java.util.List;
import java.util.Map;

/** Gestión de usuarios. Todas las rutas exigen rol ADMIN (ver SecurityConfig). */
@RestController
@RequestMapping("/api/auth/admin/usuarios")
@RequiredArgsConstructor
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    @GetMapping
    public ResponseEntity<List<PerfilResponse>> listar() {
        return ResponseEntity.ok(usuarioAdminService.listar());
    }

    /** Cuerpo: {"activo": true|false} */
    @PutMapping("/{id}/estado")
    public ResponseEntity<PerfilResponse> cambiarEstado(@PathVariable Long id,
                                                        @RequestBody Map<String, Boolean> body,
                                                        Authentication authentication) {
        boolean activo = Boolean.TRUE.equals(body.get("activo"));
        return ResponseEntity.ok(usuarioAdminService.cambiarEstado(id, activo, authentication.getName()));
    }

    /** Cuerpo: {"rol": "ESTUDIANTE"|"ORGANIZADOR"|"ADMIN"} */
    @PutMapping("/{id}/rol")
    public ResponseEntity<PerfilResponse> cambiarRol(@PathVariable Long id,
                                                     @RequestBody Map<String, String> body,
                                                     Authentication authentication) {
        return ResponseEntity.ok(usuarioAdminService.cambiarRol(id, body.get("rol"), authentication.getName()));
    }
}
