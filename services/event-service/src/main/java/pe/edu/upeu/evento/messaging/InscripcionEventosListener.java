package pe.edu.upeu.evento.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import pe.edu.upeu.evento.service.InscritosService;
import tools.jackson.databind.json.JsonMapper;

/**
 * Segundo consumidor del tópico de inscripciones (el primero es notification-service).
 * Cada servicio usa su propio groupId, así ambos reciben todos los eventos.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InscripcionEventosListener {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final InscritosService inscritosService;

    @KafkaListener(topics = InscripcionConfirmadaEvent.TOPIC, groupId = "event-service")
    public void onMensaje(String payload) {
        InscripcionConfirmadaEvent evento;
        try {
            evento = JSON.readValue(payload, InscripcionConfirmadaEvent.class);
        } catch (Exception e) {
            // Mensaje inválido: no se reintenta, se registra y se descarta.
            log.error("Mensaje invalido en {}: {} | payload={}",
                    InscripcionConfirmadaEvent.TOPIC, e.getMessage(), payload);
            return;
        }

        // Solo una inscripcion confirmada ocupa un cupo; las canceladas nunca lo ocuparon.
        if (!InscripcionConfirmadaEvent.TIPO.equals(evento.tipo())) {
            log.debug("Evento {} de tipo {} ignorado por event-service", evento.eventId(), evento.tipo());
            return;
        }

        boolean aplicado = inscritosService.registrarInscripcionConfirmada(evento);
        if (aplicado) {
            log.info("Inscritos +1 en evento {} (evento Kafka {})", evento.eventoId(), evento.eventId());
        } else {
            log.warn("Evento duplicado {} ignorado (idempotencia)", evento.eventId());
        }
    }
}
