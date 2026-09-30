package pe.edu.upeu.inscripcion.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InscripcionRequest {

    @NotNull(message = "El eventoId es obligatorio")
    private Long eventoId;
}