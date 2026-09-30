package pe.edu.upeu.inscripcion.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagoResponse {
    private Long id;
    private BigDecimal monto;
    private String metodo;
    private String estado;
    private String transactionCode;
    private LocalDateTime createdAt;
}