package pe.edu.upeu.inscripcion.service;

import feign.FeignException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.edu.upeu.inscripcion.client.EventoClient;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventoConsultaService {

    private final EventoClient eventoClient;

    @CircuitBreaker(name = "eventoService", fallbackMethod = "eventoFallback")
    public Optional<EventoClienteResponse> buscarEvento(Long eventoId) {

        try {
            EventoClienteResponse evento = eventoClient.buscarEventoRaw(eventoId);
            return Optional.ofNullable(evento);

        } catch (FeignException.NotFound e) {
            return Optional.empty();
        }
    }

    private Optional<EventoClienteResponse> eventoFallback(Long eventoId, Throwable t) {
        log.error(
            "event-service no disponible al consultar evento {}: {}",
            eventoId,
            t.getMessage()
        );

        return Optional.empty();
    }
}