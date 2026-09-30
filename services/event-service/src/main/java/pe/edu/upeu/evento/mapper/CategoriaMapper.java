package pe.edu.upeu.evento.mapper;

import org.springframework.stereotype.Component;
import pe.edu.upeu.evento.dto.CategoriaRequest;
import pe.edu.upeu.evento.dto.CategoriaResponse;
import pe.edu.upeu.evento.entity.Categoria;

@Component
public class CategoriaMapper {

    public Categoria toEntity(CategoriaRequest request) {
        return Categoria.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .build();
    }

    public CategoriaResponse toResponse(Categoria categoria) {
        return CategoriaResponse.builder()
                .id(categoria.getId())
                .nombre(categoria.getNombre())
                .descripcion(categoria.getDescripcion())
                .build();
    }
}