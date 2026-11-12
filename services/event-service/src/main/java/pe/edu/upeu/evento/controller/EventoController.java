package pe.edu.upeu.evento.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.evento.dto.EventoRequest;
import pe.edu.upeu.evento.dto.EventoResponse;
import pe.edu.upeu.evento.service.EventoService;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    public ResponseEntity<List<EventoResponse>> listar() {
        return ResponseEntity.ok(eventoService.listar());
    }

    /** Eventos creados por el organizador autenticado (ADMIN: todos). */
    @GetMapping("/mis-eventos")
    public ResponseEntity<List<EventoResponse>> misEventos(Authentication authentication) {
        return ResponseEntity.ok(eventoService.misEventos(authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(eventoService.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<EventoResponse> crear(@Valid @RequestBody EventoRequest request,
                                                Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventoService.crear(request, authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventoResponse> actualizar(@PathVariable Long id,
                                                     @Valid @RequestBody EventoRequest request,
                                                     Authentication authentication) {
        return ResponseEntity.ok(eventoService.actualizar(id, request, authentication));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<EventoResponse> cancelar(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(eventoService.cancelar(id, authentication));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, Authentication authentication) {
        eventoService.eliminar(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
