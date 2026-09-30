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
    private String estudianteCorreo;
    private Long eventoId;
    private String estado;
    private LocalDateTime fechaInscripcion;
}