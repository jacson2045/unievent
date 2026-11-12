package pe.edu.upeu.inscripcion.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscripcionResponse {
    private Long id;
    /** true si la inscripción sigue PENDIENTE y el evento tiene costo. */
    private Boolean requierePago;
    private String estudianteCorreo;
    private Long eventoId;
    private String estado;
    private LocalDateTime fechaInscripcion;
}