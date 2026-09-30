package pe.edu.upeu.evento.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private LocalDateTime fecha;
    private String lugar;
    private Integer capacidad;
    private BigDecimal precio;
    private String estado;
    private CategoriaResponse categoria;
}