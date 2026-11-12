package pe.edu.upeu.auth.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistroRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(max = 150)
    private String nombreCompleto;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    // El registro público no permite crear administradores: el ADMIN inicial se crea al arrancar
    // (AdminInicial) y los demás roles los asigna un administrador desde la gestión de usuarios.
    @Pattern(regexp = "ESTUDIANTE|ORGANIZADOR", message = "El rol debe ser ESTUDIANTE u ORGANIZADOR")
    private String rol;
}