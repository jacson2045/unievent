package pe.edu.upeu.evento.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.evento.entity.EventoProcesado;
import pe.edu.upeu.evento.messaging.InscripcionConfirmadaEvent;
import pe.edu.upeu.evento.repository.EventoProcesadoRepository;
import pe.edu.upeu.evento.repository.EventoRepository;

import java.time.LocalDateTime;

/** Mantiene el contador de inscritos a partir de los eventos de negocio recibidos por Kafka. */
@Service
@RequiredArgsConstructor
public class InscritosService {

    private final EventoRepository eventoRepository;
    private final EventoProcesadoRepository eventoProcesadoRepository;

    /**
     * Aplica el evento una sola vez. El registro en eventos_procesados y el incremento
     * ocurren en la misma transacción: o se aplican ambos o ninguno.
     *
     * @return true si se aplicó; false si era un duplicado.
     */
    @Transactional
    public boolean registrarInscripcionConfirmada(InscripcionConfirmadaEvent evento) {
        if (eventoProcesadoRepository.existsById(evento.eventId())) {
            return false;
        }

        // La clave primaria protege también frente a dos consumidores simultáneos.
        eventoProcesadoRepository.saveAndFlush(
                new EventoProcesado(evento.eventId(), evento.tipo(), LocalDateTime.now()));

        eventoRepository.incrementarInscritos(evento.eventoId());
        return true;
    }
}
