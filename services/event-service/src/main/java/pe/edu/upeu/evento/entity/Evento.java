package pe.edu.upeu.evento.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "eventos")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "descripcion_corta", length = 200)
    private String descripcionCorta;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "lugar", nullable = false, length = 150)
    private String lugar;

    @Column(name = "capacidad", nullable = false)
    private Integer capacidad;

    @Column(name = "inscritos", nullable = false)
    @Builder.Default
    private Integer inscritos = 0;

    @Column(name = "precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "ACTIVO";

    @Column(name = "modalidad", length = 20)
    @Builder.Default
    private String modalidad = "PRESENCIAL";

    @Column(name = "organizador", length = 150)
    private String organizador;

    @Column(name = "requisitos", length = 300)
    private String requisitos;

    @Column(name = "tags", length = 255)
    private String tags;

    @Column(name = "imagen_url", length = 500)
    private String imagenUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria categoria;
}
