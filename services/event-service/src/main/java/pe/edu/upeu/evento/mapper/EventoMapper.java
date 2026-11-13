package pe.edu.upeu.evento.mapper;

import org.springframework.stereotype.Component;
import pe.edu.upeu.evento.dto.EventoRequest;
import pe.edu.upeu.evento.dto.EventoResponse;
import pe.edu.upeu.evento.entity.Categoria;
import pe.edu.upeu.evento.entity.Evento;

import java.util.Arrays;
import java.util.List;

@Component
public class EventoMapper {

    private final CategoriaMapper categoriaMapper;

    public EventoMapper(CategoriaMapper categoriaMapper) {
        this.categoriaMapper = categoriaMapper;
    }

    public Evento toEntity(EventoRequest request, Categoria categoria) {
        Evento evento = Evento.builder().categoria(categoria).build();
        aplicar(request, evento, categoria);
        return evento;
    }

    /** Copia los datos editables de la petición sobre la entidad (crear y actualizar). */
    public void aplicar(EventoRequest request, Evento evento, Categoria categoria) {
        evento.setNombre(request.getNombre());
        evento.setDescripcion(request.getDescripcion());
        evento.setDescripcionCorta(request.getDescripcionCorta());
        evento.setFecha(request.getFecha());
        evento.setFechaFin(request.getFechaFin());
        evento.setLugar(request.getLugar());
        evento.setCapacidad(request.getCapacidad());
        evento.setPrecio(request.getPrecio());
        evento.setModalidad(request.getModalidad() != null ? request.getModalidad() : "PRESENCIAL");
        evento.setOrganizador(request.getOrganizador());
        evento.setRequisitos(request.getRequisitos());
        evento.setTags(request.getTags());
        evento.setImagenUrl(request.getImagenUrl());
        evento.setDireccion(request.getDireccion());
        evento.setCategoria(categoria);
    }

    public EventoResponse toResponse(Evento evento) {
        int inscritos = evento.getInscritos() != null ? evento.getInscritos() : 0;
        return EventoResponse.builder()
                .id(evento.getId())
                .nombre(evento.getNombre())
                .descripcion(evento.getDescripcion())
                .descripcionCorta(evento.getDescripcionCorta())
                .fecha(evento.getFecha())
                .fechaFin(evento.getFechaFin())
                .lugar(evento.getLugar())
                .capacidad(evento.getCapacidad())
                .inscritos(inscritos)
                .cuposDisponibles(Math.max(0, evento.getCapacidad() - inscritos))
                .precio(evento.getPrecio())
                .estado(evento.getEstado())
                .modalidad(evento.getModalidad())
                .organizador(evento.getOrganizador())
                .requisitos(evento.getRequisitos())
                .tags(separarTags(evento.getTags()))
                .imagenUrl(evento.getImagenUrl())
                .direccion(evento.getDireccion())
                .categoria(categoriaMapper.toResponse(evento.getCategoria()))
                .build();
    }

    private List<String> separarTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .toList();
    }
}
