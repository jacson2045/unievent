
package pe.edu.upeu.notificacion.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.upeu.notificacion.entity.EventoProcesado;
import pe.edu.upeu.notificacion.entity.Notificacion;
import pe.edu.upeu.notificacion.messaging.InscripcionConfirmadaEvent;
import pe.edu.upeu.notificacion.repository.EventoProcesadoRepository;
import pe.edu.upeu.notificacion.repository.NotificacionRepository;

import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock
    private NotificacionRepository notificacionRepository;

    @Mock
    private EventoProcesadoRepository eventoProcesadoRepository;

    @InjectMocks
    private NotificacionService notificacionService;

    private InscripcionConfirmadaEvent evento(String eventId) {
        return new InscripcionConfirmadaEvent(
                eventId,
                InscripcionConfirmadaEvent.TIPO,
                "2026-10-29T10:00:00Z",
                7L,
                3L,
                2L,
                "ana@upeu.edu.pe",
                new BigDecimal("25.00")
        );
    }

    @Test
    void eventoNuevoCreaUnaNotificacionYRegistraSuProcesamiento() {
        when(eventoProcesadoRepository.existsById("evt-1"))
                .thenReturn(false);

        boolean resultado = notificacionService.procesar(evento("evt-1"));

        assertTrue(resultado);

        verify(eventoProcesadoRepository, times(1))
                .saveAndFlush(any(EventoProcesado.class));

        verify(notificacionRepository, times(1))
                .save(any(Notificacion.class));
    }

    @Test
    void eventoDuplicadoNoCreaOtraNotificacion() {
        when(eventoProcesadoRepository.existsById("evt-1"))
                .thenReturn(true);

        boolean resultado = notificacionService.procesar(evento("evt-1"));

        assertFalse(resultado);

        verify(eventoProcesadoRepository, never())
                .saveAndFlush(any(EventoProcesado.class));

        verify(notificacionRepository, never())
                .save(any(Notificacion.class));
    }

    @Test
    void eventoConNombreUsaElNombreEnElMensaje() {
        when(eventoProcesadoRepository.existsById("evt-2")).thenReturn(false);

        notificacionService.procesar(new InscripcionConfirmadaEvent(
                "evt-2", InscripcionConfirmadaEvent.TIPO, "2026-11-12T10:00:00Z",
                8L, null, 6L, "ana@upeu.edu.pe", BigDecimal.ZERO, "Congreso de Investigación"));

        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).save(captor.capture());
        assertTrue(captor.getValue().getMensaje().contains("«Congreso de Investigación»"));
        assertTrue(captor.getValue().getMensaje().contains("Evento gratuito"));
    }

    @Test
    void inscripcionCanceladaCreaAvisoDeCompensacion() {
        when(eventoProcesadoRepository.existsById("evt-3")).thenReturn(false);

        boolean resultado = notificacionService.procesar(new InscripcionConfirmadaEvent(
                "evt-3", InscripcionConfirmadaEvent.TIPO_CANCELADA, "2026-11-12T10:00:00Z",
                9L, 4L, 2L, "ana@upeu.edu.pe", new BigDecimal("10.00"), "Taller de Spring Boot"));

        assertTrue(resultado);
        ArgumentCaptor<Notificacion> captor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).save(captor.capture());
        assertEquals(InscripcionConfirmadaEvent.TIPO_CANCELADA, captor.getValue().getTipo());
        assertTrue(captor.getValue().getTitulo().contains("anulada"));
    }
}
