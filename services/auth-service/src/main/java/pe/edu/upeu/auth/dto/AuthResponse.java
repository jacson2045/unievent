package pe.edu.upeu.auth.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String nombreCompleto;
    private String correo;
    private String rol;
}