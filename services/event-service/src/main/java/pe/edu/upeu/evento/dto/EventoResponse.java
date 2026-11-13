package pe.edu.upeu.evento.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoResponse {
    private Long id;
    private String nombre;
    private String descripcion;
    private String descripcionCorta;
    private LocalDateTime fecha;
    private LocalDateTime fechaFin;
    private String lugar;
    private Integer capacidad;
    private Integer inscritos;
    private Integer cuposDisponibles;
    private BigDecimal precio;
    private String estado;
    private String modalidad;
    private String organizador;
    private String requisitos;
    private List<String> tags;
    private String imagenUrl;
    private String direccion;
    private CategoriaResponse categoria;
}