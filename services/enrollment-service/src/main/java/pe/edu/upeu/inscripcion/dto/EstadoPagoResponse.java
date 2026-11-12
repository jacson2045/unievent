package pe.edu.upeu.inscripcion.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoPagoResponse {
    private Long pagoId;
    private Long inscripcionId;
    private String estado;
    private String estadoInscripcion;
    private java.math.BigDecimal monto;
    private String metodo;
    private String transactionCode;
}