package pe.edu.upeu.evento.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(title = "UniEvent Pay - event-service", version = "1.0",
        description = "Eventos y categorias"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer",
        bearerFormat = "JWT", description = "Pega el token JWT sin la palabra Bearer")
public class OpenApiConfig {

    @Bean
    public OpenApiCustomizer candadoEnEscritura() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }
            openApi.getPaths().values().forEach(pathItem ->
                    pathItem.readOperationsMap().forEach((metodo, operacion) -> {
                        if (metodo != PathItem.HttpMethod.GET) {
                            operacion.addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
                        }
                    }));
        };
    }
}