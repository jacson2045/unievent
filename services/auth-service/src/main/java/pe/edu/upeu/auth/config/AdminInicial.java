package pe.edu.upeu.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import pe.edu.upeu.auth.entity.Usuario;
import pe.edu.upeu.auth.repository.UsuarioRepository;

/**
 * Crea el primer administrador al arrancar si todavía no existe ninguno.
 * La contraseña viene de la variable de entorno ADMIN_PASSWORD (nunca del repositorio);
 * si no está definida, no se crea nada y se deja un aviso en el log.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInicial implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.correo:admin@upeu.edu.pe}")
    private String correo;

    @Value("${app.admin.nombre:Administrador UniEvent}")
    private String nombre;

    @Value("${app.admin.password:${ADMIN_PASSWORD:}}")
    private String password;

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepository.existsByRol("ADMIN")) {
            return;
        }
        if (password == null || password.isBlank()) {
            log.warn("No existe ningún ADMIN y ADMIN_PASSWORD no está definida: no se creó el administrador inicial.");
            return;
        }
        if (password.length() < 8) {
            log.warn("ADMIN_PASSWORD debe tener al menos 8 caracteres: no se creó el administrador inicial.");
            return;
        }
        if (usuarioRepository.existsByCorreo(correo)) {
            log.warn("El correo {} ya existe con otro rol: no se creó el administrador inicial.", correo);
            return;
        }

        usuarioRepository.save(Usuario.builder()
                .nombreCompleto(nombre)
                .correo(correo)
                .password(passwordEncoder.encode(password))
                .rol("ADMIN")
                .activo(true)
                .build());
        log.info("Administrador inicial creado: {}", correo);
    }
}
