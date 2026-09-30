package pe.edu.upeu.inscripcion.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstadoPagoResponse {
    private Long pagoId;
    private String estado;
    private String transactionCode;
}