package pe.edu.upeu.inscripcion.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsistenciaResponse {
    private Long inscripcionId;
    private Long eventoId;
    private String estudianteCorreo;
    private LocalDateTime fechaAsistencia;
}
