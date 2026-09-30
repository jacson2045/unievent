package pe.edu.upeu.inscripcion.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;

import java.util.Optional;

@Component
public class EventoClient {

    private final RestClient restClient;

    public EventoClient(@Value("${services.event-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public Optional<EventoClienteResponse> buscarEvento(Long eventoId) {
        try {
            EventoClienteResponse evento = restClient.get()
                    .uri("/api/eventos/{id}", eventoId)
                    .retrieve()
                    .body(EventoClienteResponse.class);
            return Optional.ofNullable(evento);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }
}