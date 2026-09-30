package pe.edu.upeu.evento.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.upeu.evento.dto.EventoRequest;
import pe.edu.upeu.evento.dto.EventoResponse;
import pe.edu.upeu.evento.entity.Categoria;
import pe.edu.upeu.evento.entity.Evento;
import pe.edu.upeu.evento.mapper.EventoMapper;
import pe.edu.upeu.evento.repository.CategoriaRepository;
import pe.edu.upeu.evento.repository.EventoRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final CategoriaRepository categoriaRepository;
    private final EventoMapper eventoMapper;

    public List<EventoResponse> listar() {
        return eventoRepository.findAllConCategoria()
                .stream()
                .map(eventoMapper::toResponse)
                .toList();
    }

    public EventoResponse obtenerPorId(Long id) {
        Evento evento = eventoRepository.findByIdConCategoria(id)
                .orElseThrow(() -> new NoSuchElementException("Evento no encontrado con id: " + id));
        return eventoMapper.toResponse(evento);
    }

    public EventoResponse crear(EventoRequest request) {
        Categoria categoria = buscarCategoriaOLanzarError(request.getCategoriaId());
        Evento evento = eventoMapper.toEntity(request, categoria);
        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    public EventoResponse actualizar(Long id, EventoRequest request) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Evento no encontrado con id: " + id));
        Categoria categoria = buscarCategoriaOLanzarError(request.getCategoriaId());

        evento.setNombre(request.getNombre());
        evento.setDescripcion(request.getDescripcion());
        evento.setFecha(request.getFecha());
        evento.setLugar(request.getLugar());
        evento.setCapacidad(request.getCapacidad());
        evento.setPrecio(request.getPrecio());
        evento.setCategoria(categoria);

        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    public void eliminar(Long id) {
        if (!eventoRepository.existsById(id)) {
            throw new NoSuchElementException("Evento no encontrado con id: " + id);
        }
        eventoRepository.deleteById(id);
    }

    private Categoria buscarCategoriaOLanzarError(Long categoriaId) {
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new NoSuchElementException("Categoría no encontrada con id: " + categoriaId));
    }
}