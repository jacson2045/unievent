package pe.edu.upeu.inscripcion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.entity.Pago;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/**
 * Publica eventos de negocio en Kafka. Nunca rompe el flujo de pago:
 * si Kafka no responde, el error se registra y la confirmacion sigue valida.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InscripcionEventPublisher {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void publicarInscripcionConfirmada(Inscripcion inscripcion, Pago pago) {
        try {
            // Id determinista: el mismo hecho de negocio produce siempre el mismo eventId,
            // asi el consumidor puede detectar duplicados.
            String eventId = UUID.nameUUIDFromBytes(
                    (InscripcionConfirmadaEvent.TIPO + ":" + inscripcion.getId())
                            .getBytes(StandardCharsets.UTF_8)).toString();

            InscripcionConfirmadaEvent evento = new InscripcionConfirmadaEvent(
                    eventId,
                    InscripcionConfirmadaEvent.TIPO,
                    Instant.now().toString(),
                    inscripcion.getId(),
                    pago.getId(),
                    inscripcion.getEventoId(),
                    inscripcion.getEstudianteCorreo(),
                    pago.getMonto());

            String payload = JSON.writeValueAsString(evento);

            kafkaTemplate
                    .send(InscripcionConfirmadaEvent.TOPIC, String.valueOf(inscripcion.getId()), payload)
                    .whenComplete((resultado, error) -> {
                        if (error != null) {
                            log.error("No se pudo publicar el evento {} de la inscripcion {}: {}",
                                    eventId, inscripcion.getId(), error.getMessage());
                        } else {
                            log.info("Evento {} publicado en {} (inscripcion {})",
                                    eventId, InscripcionConfirmadaEvent.TOPIC, inscripcion.getId());
                        }
                    });

        } catch (Exception e) {
            log.error("Fallo al publicar el evento de la inscripcion {}: {}",
                    inscripcion.getId(), e.getMessage());
        }
    }
}
