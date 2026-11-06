package pe.edu.upeu.notificacion.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import pe.edu.upeu.notificacion.service.NotificacionService;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class InscripcionEventosListener {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final NotificacionService notificacionService;

    @KafkaListener(topics = InscripcionConfirmadaEvent.TOPIC, groupId = "notification-service")
    public void onMensaje(String payload) {
        InscripcionConfirmadaEvent evento;

        try {
            evento = JSON.readValue(payload, InscripcionConfirmadaEvent.class);
        } catch (Exception e) {
            // Mensaje venenoso: no se reintenta, se registra y se descarta.
            log.error("Mensaje invalido en {}: {} | payload={}",
                    InscripcionConfirmadaEvent.TOPIC, e.getMessage(), payload);
            return;
        }

        log.info("Evento recibido: id={} tipo={} inscripcion={}",
                evento.eventId(), evento.tipo(), evento.inscripcionId());

        boolean procesado = notificacionService.procesar(evento);

        if (procesado) {
            log.info("Notificacion creada para {}", evento.estudianteCorreo());
        } else {
            log.warn("Evento duplicado {} ignorado (idempotencia)", evento.eventId());
        }
    }
}
