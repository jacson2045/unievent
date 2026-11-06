
package pe.edu.upeu.inscripcion.messaging;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.core.KafkaTemplate;

import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.entity.Pago;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InscripcionEventPublisherTest {

    @SuppressWarnings("unchecked")
    private final KafkaTemplate<String, String> kafkaTemplate =
            mock(KafkaTemplate.class);

    private final InscripcionEventPublisher publisher =
            new InscripcionEventPublisher(kafkaTemplate);

    @Test
    void debePublicarEventoCuandoSeConfirmaInscripcion() {

        Inscripcion inscripcion = Inscripcion.builder()
                .id(999999L)
                .estudianteCorreo("prueba-unitaria@example.com")
                .eventoId(1L)
                .estado("CONFIRMADA")
                .fechaInscripcion(LocalDateTime.now())
                .build();

        Pago pago = Pago.builder()
                .id(999999L)
                .inscripcion(inscripcion)
                .monto(new BigDecimal("15.00"))
                .metodo("TEST")
                .estado("APPROVED")
                .createdAt(LocalDateTime.now())
                .build();

        when(kafkaTemplate.send(
                eq(InscripcionConfirmadaEvent.TOPIC),
                eq("999999"),
                any(String.class)
        )).thenReturn(CompletableFuture.completedFuture(null));

        assertDoesNotThrow(
                () -> publisher.publicarInscripcionConfirmada(
                        inscripcion, pago)
        );

        ArgumentCaptor<String> payloadCaptor =
                ArgumentCaptor.forClass(String.class);

        verify(kafkaTemplate).send(
                eq(InscripcionConfirmadaEvent.TOPIC),
                eq("999999"),
                payloadCaptor.capture()
        );

        String payload = payloadCaptor.getValue();

        assertAll(
                () -> assertTrue(payload.contains(
                        "\"tipo\":\"INSCRIPCION_CONFIRMADA\"")),
                () -> assertTrue(payload.contains(
                        "\"inscripcionId\":999999")),
                () -> assertTrue(payload.contains(
                        "\"eventoId\":1")),
                () -> assertTrue(payload.contains(
                        "\"estudianteCorreo\":\"prueba-unitaria@example.com\"")),
                () -> assertTrue(payload.contains(
                        "\"monto\":15.00"))
        );
    }
}
