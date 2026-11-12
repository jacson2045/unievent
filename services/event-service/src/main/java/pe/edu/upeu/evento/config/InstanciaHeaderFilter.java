package pe.edu.upeu.evento.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Agrega la cabecera X-Instancia (servicio:puerto) a cada respuesta.
 * Sirve como evidencia del balanceo: al repetir una petición por el gateway
 * se ve qué instancia de event-service la atendió.
 */
@Component
public class InstanciaHeaderFilter extends OncePerRequestFilter {

    private final String instancia;

    public InstanciaHeaderFilter(@Value("${spring.application.name}") String nombre,
                                 @Value("${server.port}") String puerto) {
        this.instancia = nombre + ":" + puerto;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        response.setHeader("X-Instancia", instancia);
        chain.doFilter(request, response);
    }
}
