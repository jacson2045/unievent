package pe.edu.upeu.notificacion.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.notificacion.dto.NotificacionResponse;
import pe.edu.upeu.notificacion.service.NotificacionService;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listar(Authentication authentication) {
        return ResponseEntity.ok(notificacionService.listar(authentication.getName()));
    }

    @PutMapping("/{id}/leida")
    public ResponseEntity<NotificacionResponse> marcarLeida(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(notificacionService.marcarLeida(id, authentication.getName()));
    }
}
