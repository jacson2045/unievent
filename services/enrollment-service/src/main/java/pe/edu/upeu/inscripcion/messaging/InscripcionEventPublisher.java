package pe.edu.upeu.inscripcion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.entity.Pago;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/**
 * Publica eventos de negocio en Kafka. Nunca rompe el flujo de pago:
 * si Kafka no responde, el error se registra y la operacion sigue valida.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InscripcionEventPublisher {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publicarInscripcionConfirmada(Inscripcion inscripcion, Pago pago) {
        publicarInscripcionConfirmada(inscripcion, pago, null);
    }

    public void publicarInscripcionConfirmada(Inscripcion inscripcion, Pago pago, String eventoNombre) {
        publicar(InscripcionConfirmadaEvent.TIPO, inscripcion, pago, eventoNombre);
    }

    /** Compensacion: la inscripcion pendiente se anulo porque el pago fue rechazado o cancelado. */
    public void publicarInscripcionCancelada(Inscripcion inscripcion, Pago pago, String eventoNombre) {
        publicar(InscripcionConfirmadaEvent.TIPO_CANCELADA, inscripcion, pago, eventoNombre);
    }

    private void publicar(String tipo, Inscripcion inscripcion, Pago pago, String eventoNombre) {
        try {
            // Id determinista: el mismo hecho de negocio produce siempre el mismo eventId,
            // asi el consumidor puede detectar duplicados.
            String eventId = UUID.nameUUIDFromBytes(
                    (tipo + ":" + inscripcion.getId())
                            .getBytes(StandardCharsets.UTF_8)).toString();

            InscripcionConfirmadaEvent evento = new InscripcionConfirmadaEvent(
                    eventId,
                    tipo,
                    Instant.now().toString(),
                    inscripcion.getId(),
                    // Evento gratuito: no hay pago asociado.
                    pago != null ? pago.getId() : null,
                    inscripcion.getEventoId(),
                    inscripcion.getEstudianteCorreo(),
                    pago != null ? pago.getMonto() : BigDecimal.ZERO,
                    eventoNombre);

            String payload = JSON.writeValueAsString(evento);

            kafkaTemplate
                    .send(InscripcionConfirmadaEvent.TOPIC, String.valueOf(inscripcion.getId()), payload)
                    .whenComplete((resultado, error) -> {
                        if (error != null) {
                            log.error("No se pudo publicar el evento {} ({}) de la inscripcion {}: {}",
                                    eventId, tipo, inscripcion.getId(), error.getMessage());
                        } else {
                            log.info("Evento {} ({}) publicado en {} (inscripcion {})",
                                    eventId, tipo, InscripcionConfirmadaEvent.TOPIC, inscripcion.getId());
                        }
                    });

        } catch (Exception e) {
            log.error("Fallo al publicar el evento {} de la inscripcion {}: {}",
                    tipo, inscripcion.getId(), e.getMessage());
        }
    }
}
