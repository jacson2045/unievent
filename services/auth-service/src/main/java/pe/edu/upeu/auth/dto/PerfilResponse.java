package pe.edu.upeu.auth.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerfilResponse {
    private Long id;
    private String nombreCompleto;
    private String correo;
    private String rol;
    private Boolean activo;
    private LocalDateTime creadoEn;
}
