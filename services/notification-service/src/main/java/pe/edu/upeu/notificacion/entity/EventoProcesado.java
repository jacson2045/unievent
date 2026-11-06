package pe.edu.upeu.notificacion.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Registro de eventos ya procesados: garantiza idempotencia del consumidor. */
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
