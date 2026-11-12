
package pe.edu.upeu.inscripcion.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.inscripcion.dto.AsistenciaRequest;
import pe.edu.upeu.inscripcion.dto.AsistenciaResponse;
import pe.edu.upeu.inscripcion.dto.InscripcionRequest;
import pe.edu.upeu.inscripcion.dto.InscripcionResponse;
import pe.edu.upeu.inscripcion.service.AsistenciaService;
import pe.edu.upeu.inscripcion.service.InscripcionService;

import java.util.List;

@RestController
@RequestMapping("/api/inscripciones")
@RequiredArgsConstructor
public class InscripcionController {

    private final InscripcionService inscripcionService;
    private final AsistenciaService asistenciaService;

    @PostMapping
    public ResponseEntity<InscripcionResponse> crear(
            @Valid @RequestBody InscripcionRequest request,
            Authentication authentication) {

        String estudianteCorreo = authentication.getName();

        InscripcionResponse response =
                inscripcionService.crear(request, estudianteCorreo);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<InscripcionResponse>> listar(
            Authentication authentication) {

        String estudianteCorreo = authentication.getName();

        return ResponseEntity.ok(
                inscripcionService.listarPorEstudiante(estudianteCorreo));
    }

    /** Organizador: inscripciones (con su pago) de los eventos que organiza. */
    @GetMapping("/organizador")
    public ResponseEntity<List<InscripcionResponse>> deMisEventos(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) Long eventoId) {
        return ResponseEntity.ok(inscripcionService.listarDeMisEventos(authorization, eventoId));
    }

    /** Organizador: registra la asistencia escaneando o escribiendo el código del QR. */
    @PostMapping("/organizador/asistencia")
    public ResponseEntity<AsistenciaResponse> registrarAsistencia(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody AsistenciaRequest request) {
        return ResponseEntity.ok(asistenciaService.registrarPorCodigo(
                authorization, request.getCodigo(), request.getEventoId()));
    }

    /** Organizador: registro manual desde la lista de participantes. */
    @PostMapping("/organizador/{id}/asistencia")
    public ResponseEntity<AsistenciaResponse> registrarAsistenciaManual(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id) {
        return ResponseEntity.ok(asistenciaService.registrarPorInscripcion(authorization, id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InscripcionResponse> obtenerPorId(
            @PathVariable Long id,
            Authentication authentication) {

        String estudianteCorreo = authentication.getName();

        return ResponseEntity.ok(
                inscripcionService.obtenerPorId(id, estudianteCorreo));
    }
}
