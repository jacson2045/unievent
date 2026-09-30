package pe.edu.upeu.evento.mapper;

import org.springframework.stereotype.Component;
import pe.edu.upeu.evento.dto.EventoRequest;
import pe.edu.upeu.evento.dto.EventoResponse;
import pe.edu.upeu.evento.entity.Categoria;
import pe.edu.upeu.evento.entity.Evento;

@Component
public class EventoMapper {

    private final CategoriaMapper categoriaMapper;

    public EventoMapper(CategoriaMapper categoriaMapper) {
        this.categoriaMapper = categoriaMapper;
    }

    public Evento toEntity(EventoRequest request, Categoria categoria) {
        return Evento.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .fecha(request.getFecha())
                .lugar(request.getLugar())
                .capacidad(request.getCapacidad())
                .precio(request.getPrecio())
                .categoria(categoria)
                .build();
    }

    public EventoResponse toResponse(Evento evento) {
        return EventoResponse.builder()
                .id(evento.getId())
                .nombre(evento.getNombre())
                .descripcion(evento.getDescripcion())
                .fecha(evento.getFecha())
                .lugar(evento.getLugar())
                .capacidad(evento.getCapacidad())
                .precio(evento.getPrecio())
                .estado(evento.getEstado())
                .categoria(categoriaMapper.toResponse(evento.getCategoria()))
                .build();
    }
}