package pe.edu.upeu.inscripcion.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventoClienteResponse {
    private Long id;
    private String nombre;
    private LocalDateTime fecha;
    private Integer capacidad;
    private BigDecimal precio;
    private String estado;

    public boolean esGratuito() {
        return precio == null || precio.signum() <= 0;
    }
}
