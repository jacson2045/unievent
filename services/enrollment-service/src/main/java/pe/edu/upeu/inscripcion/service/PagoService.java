
package pe.edu.upeu.inscripcion.service;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import pe.edu.upeu.inscripcion.dto.EstadoPagoResponse;
import pe.edu.upeu.inscripcion.dto.EventoClienteResponse;
import pe.edu.upeu.inscripcion.dto.PreferenciaResponse;
import pe.edu.upeu.inscripcion.entity.Inscripcion;
import pe.edu.upeu.inscripcion.entity.Pago;
import pe.edu.upeu.inscripcion.repository.InscripcionRepository;
import pe.edu.upeu.inscripcion.repository.PagoRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final InscripcionRepository inscripcionRepository;
    private final PagoRepository pagoRepository;
    private final EventoConsultaService eventoConsultaService;

    public PreferenciaResponse crearPreferencia(
            Long inscripcionId,
            String estudianteCorreo) {

        Inscripcion inscripcion = inscripcionRepository
                .findById(inscripcionId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Inscripcion no encontrada"));

        if (!inscripcion.getEstudianteCorreo()
                .equals(estudianteCorreo)) {
            throw new IllegalStateException(
                    "No puedes pagar una inscripcion de otro estudiante");
        }

        if ("CONFIRMADA".equals(inscripcion.getEstado())) {
            throw new IllegalStateException(
                    "La inscripcion ya esta confirmada y no requiere otro pago");
        }

        if (pagoRepository.existsByInscripcionIdAndEstado(
                inscripcionId, "APPROVED")) {
            throw new IllegalStateException(
                    "La inscripcion ya tiene un pago aprobado");
        }

        if (pagoRepository.existsByInscripcionIdAndEstado(
                inscripcionId, "PENDING")) {
            throw new IllegalStateException(
                    "Ya existe un pago pendiente para esta inscripcion");
        }

        EventoClienteResponse evento =
                eventoConsultaService.buscarEvento(
                                inscripcion.getEventoId())
                        .orElseThrow(() ->
                                new NoSuchElementException(
                                        "El evento ya no existe"));

        Pago pago = Pago.builder()
                .inscripcion(inscripcion)
                .monto(evento.getPrecio())
                .estado("PENDING")
                .build();

        try {
            // El índice V4 protege frente a solicitudes simultaneas.
            pago = pagoRepository.saveAndFlush(pago);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException(
                    "Ya existe un pago activo para esta inscripcion. "
                    + "Consulta el estado del pago antes de intentarlo otra vez.");
        }

        try {
            PreferenceItemRequest item =
                    PreferenceItemRequest.builder()
                            .title(evento.getNombre())
                            .quantity(1)
                            .currencyId("PEN")
                            .unitPrice(evento.getPrecio())
                            .build();

            PreferenceRequest request =
                    PreferenceRequest.builder()
                            .items(List.of(item))
                            .externalReference(
                                    pago.getId().toString())
                            .backUrls(
                                    PreferenceBackUrlsRequest.builder()
                                            .success("http://localhost:4200/pago-exitoso")
                                            .pending("http://localhost:4200/pago-pendiente")
                                            .failure("http://localhost:4200/pago-fallido")
                                            .build())
                            .build();

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(request);

            pago.setPreferenceId(preference.getId());
            pagoRepository.save(pago);

            return PreferenciaResponse.builder()
                    .pagoId(pago.getId())
                    .monto(pago.getMonto())
                    .estado(pago.getEstado())
                    .checkoutUrl(preference.getSandboxInitPoint())
                    .build();

        } catch (Exception e) {
            /*
             * Se libera el índice V4 para permitir otro intento.
             * Si Mercado Pago alcanzo a crear la preferencia antes
             * de producirse un error de comunicacion, se requiere
             * conciliacion posterior con el proveedor.
             */
            try {
                pago.setEstado("CANCELLED");
                pagoRepository.saveAndFlush(pago);
            } catch (Exception errorGuardado) {
                e.addSuppressed(errorGuardado);
            }

            throw new IllegalStateException(
                    "No se pudo generar la preferencia de pago. "
                    + "Verifica el estado antes de volver a intentarlo.");
        }
    }

    public EstadoPagoResponse consultarEstado(
            Long inscripcionId,
            String estudianteCorreo) {

        Inscripcion inscripcion = inscripcionRepository
                .findById(inscripcionId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Inscripcion no encontrada"));

        if (!inscripcion.getEstudianteCorreo()
                .equals(estudianteCorreo)) {
            throw new IllegalStateException(
                    "No puedes consultar el pago de otro estudiante");
        }

        Pago pago = pagoRepository
                .findTopByInscripcionIdOrderByIdDesc(inscripcionId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Este pago aun no fue iniciado"));

        actualizarEstadoDesdeMercadoPago(pago);

        return EstadoPagoResponse.builder()
                .pagoId(pago.getId())
                .estado(pago.getEstado())
                .transactionCode(pago.getTransactionCode())
                .build();
    }

    private void actualizarEstadoDesdeMercadoPago(Pago pago) {
        try {
            PaymentClient paymentClient = new PaymentClient();

            Map<String, Object> filters = new HashMap<>();
            filters.put(
                    "external_reference",
                    pago.getId().toString());

            MPSearchRequest searchRequest =
                    MPSearchRequest.builder()
                            .filters(filters)
                            .limit(10)
                            .offset(0)
                            .build();

            var resultados = paymentClient.search(searchRequest);

            if (resultados.getResults() == null
                    || resultados.getResults().isEmpty()) {
                return;
            }

            Payment payment = resultados.getResults().get(0);

            String estadoAnterior = pago.getEstado();
            String nuevoEstado =
                    mapearEstado(payment.getStatus());

            // No degradar un pago aprobado por una consulta desactualizada.
            if ("APPROVED".equals(estadoAnterior)
                    && !"APPROVED".equals(nuevoEstado)) {
                return;
            }

            pago.setEstado(nuevoEstado);
            pago.setMetodo(payment.getPaymentMethodId());

            if (payment.getId() != null) {
                pago.setTransactionCode(
                        payment.getId().toString());
            }

            pagoRepository.save(pago);

            if ("APPROVED".equals(nuevoEstado)) {
                Inscripcion inscripcion = pago.getInscripcion();

                if (!"CONFIRMADA".equals(inscripcion.getEstado())) {
                    inscripcion.setEstado("CONFIRMADA");
                    inscripcionRepository.save(inscripcion);
                }
            }

        } catch (Exception e) {
            // Conserva el estado local si falla la consulta externa.
            System.err.println(
                    "No se pudo consultar el estado en Mercado Pago: "
                    + e.getMessage());
        }
    }

    private String mapearEstado(String estadoMercadoPago) {
        if (estadoMercadoPago == null) {
            return "PENDING";
        }

        return switch (estadoMercadoPago) {
            case "approved" -> "APPROVED";
            case "rejected" -> "REJECTED";
            case "cancelled" -> "CANCELLED";
            case "refunded" -> "REFUNDED";
            default -> "PENDING";
        };
    }
}
