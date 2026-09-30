package pe.edu.upeu.inscripcion.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.inscripcion.dto.EstadoPagoResponse;
import pe.edu.upeu.inscripcion.dto.PreferenciaResponse;
import pe.edu.upeu.inscripcion.service.PagoService;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @PostMapping("/{id}/pago")
    public ResponseEntity<PreferenciaResponse> crearPago(@PathVariable Long id, Authentication authentication) {
        String estudianteCorreo = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.crearPreferencia(id, estudianteCorreo));
    }

    @GetMapping("/{id}/pago/estado")
    public ResponseEntity<EstadoPagoResponse> consultarEstado(@PathVariable Long id, Authentication authentication) {
        String estudianteCorreo = authentication.getName();
        return ResponseEntity.ok(pagoService.consultarEstado(id, estudianteCorreo));
    }
}