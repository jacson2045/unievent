package pe.edu.upeu.evento.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventoRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 150)
    private String nombre;

    @Size(max = 500)
    private String descripcion;

    @NotNull(message = "La fecha es obligatoria")
    @Future(message = "La fecha debe ser futura")
    private LocalDateTime fecha;

    @NotBlank(message = "El lugar es obligatorio")
    @Size(max = 150)
    private String lugar;

    @NotNull(message = "La capacidad es obligatoria")
    @Positive(message = "La capacidad debe ser mayor a 0")
    private Integer capacidad;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
    private BigDecimal precio;

    @NotNull(message = "La categoría es obligatoria")
    private Long categoriaId;

    @Size(max = 200)
    private String descripcionCorta;

    private LocalDateTime fechaFin;

    @Pattern(regexp = "PRESENCIAL|VIRTUAL|HIBRIDO", message = "La modalidad debe ser PRESENCIAL, VIRTUAL o HIBRIDO")
    private String modalidad;

    @Size(max = 150)
    private String organizador;

    @Size(max = 300)
    private String requisitos;

    /** Etiquetas separadas por coma, por ejemplo "java,spring". */
    @Size(max = 255)
    private String tags;

    @Size(max = 500)
    private String imagenUrl;

    /** Dirección para ubicar el evento en el mapa. Opcional. */
    @Size(max = 255)
    private String direccion;

    @JsonIgnore
    @AssertTrue(message = "La fecha de fin debe ser posterior a la fecha de inicio")
    public boolean isFechaFinValida() {
        return fechaFin == null || fecha == null || fechaFin.isAfter(fecha);
    }
}