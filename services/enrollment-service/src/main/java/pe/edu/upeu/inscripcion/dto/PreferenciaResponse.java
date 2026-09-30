package pe.edu.upeu.inscripcion.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferenciaResponse {
    private Long pagoId;
    private BigDecimal monto;
    private String estado;
    private String checkoutUrl;
}