package pe.edu.upeu.inscripcion.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventoClienteResponse {
    private Long id;
    private String nombre;
    private Integer capacidad;
    private BigDecimal precio;
    private String estado;
}