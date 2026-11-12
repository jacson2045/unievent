package pe.edu.upeu.evento.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Registro de eventos Kafka ya aplicados: garantiza la idempotencia del consumidor. */
@Entity
@Table(name = "eventos_procesados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventoProcesado {

    @Id
    @Column(name = "event_id", length = 64)
    private String eventId;

    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo;

    @Column(name = "procesado_en", nullable = false)
    private LocalDateTime procesadoEn;
}
