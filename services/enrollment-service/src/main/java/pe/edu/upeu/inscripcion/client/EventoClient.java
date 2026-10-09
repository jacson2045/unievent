package pe.edu.upeu.inscripcion.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;

@FeignClient(name = "event-service", url = "${services.event-service.base-url}")
public interface EventoClient {

    @GetMapping("/api/eventos/{id}")
    EventoClienteResponse buscarEventoRaw(@PathVariable("id") Long id);
}
