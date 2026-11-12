package pe.edu.upeu.inscripcion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AsistenciaRequest {

    @NotBlank(message = "El código de asistencia es obligatorio")
    @Size(max = 20)
    private String codigo;

    /** Opcional: si se indica, el código debe pertenecer a este evento. */
    private Long eventoId;
}
