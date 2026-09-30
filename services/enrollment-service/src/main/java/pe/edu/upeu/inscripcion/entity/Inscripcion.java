package pe.edu.upeu.inscripcion.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inscripciones")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "estudiante_correo", nullable = false, length = 150)
    private String estudianteCorreo;

    @Column(name = "evento_id", nullable = false)
    private Long eventoId;

    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private String estado = "PENDIENTE";

    @Column(name = "fecha_inscripcion", nullable = false)
    @Builder.Default
    private LocalDateTime fechaInscripcion = LocalDateTime.now();
}