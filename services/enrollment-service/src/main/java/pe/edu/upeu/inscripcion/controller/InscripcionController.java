package pe.edu.upeu.inscripcion.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.inscripcion.dto.InscripcionRequest;
import pe.edu.upeu.inscripcion.dto.InscripcionResponse;
import pe.edu.upeu.inscripcion.service.InscripcionService;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
public class InscripcionController {

    private final InscripcionService inscripcionService;

    @PostMapping
    public ResponseEntity<InscripcionResponse> crear(@Valid @RequestBody InscripcionRequest request,
                                                       Authentication authentication) {
        String estudianteCorreo = authentication.getName();
        InscripcionResponse response = inscripcionService.crear(request, estudianteCorreo);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InscripcionResponse> obtenerPorId(@PathVariable Long id,
                                                              Authentication authentication) {
        String estudianteCorreo = authentication.getName();
        return ResponseEntity.ok(inscripcionService.obtenerPorId(id, estudianteCorreo));
    }
}