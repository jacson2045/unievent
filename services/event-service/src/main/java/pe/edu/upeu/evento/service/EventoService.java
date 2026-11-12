package pe.edu.upeu.evento.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
        return eventoMapper.toResponse(buscar(id));
    }

    /** Eventos del organizador autenticado. Un ADMIN ve todos. */
    public List<EventoResponse> misEventos(Authentication auth) {
        List<Evento> eventos = esAdmin(auth)
                ? eventoRepository.findAllConCategoriaOrdenFecha()
                : eventoRepository.findByOrganizadorCorreoConCategoria(auth.getName());
        return eventos.stream().map(eventoMapper::toResponse).toList();
    }

    @Transactional
    public EventoResponse crear(EventoRequest request, Authentication auth) {
        Categoria categoria = buscarCategoriaOLanzarError(request.getCategoriaId());
        Evento evento = eventoMapper.toEntity(request, categoria);
        // El dueño sale del token, no del cuerpo de la petición.
        evento.setOrganizadorCorreo(auth.getName());
        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    @Transactional
    public EventoResponse actualizar(Long id, EventoRequest request, Authentication auth) {
        Evento evento = buscar(id);
        verificarDueno(evento, auth);

        int inscritos = evento.getInscritos() != null ? evento.getInscritos() : 0;
        if (request.getCapacidad() < inscritos) {
            throw new IllegalStateException(
                    "La capacidad no puede ser menor a los " + inscritos + " inscritos actuales");
        }

        Categoria categoria = buscarCategoriaOLanzarError(request.getCategoriaId());
        eventoMapper.aplicar(request, evento, categoria);
        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    /** Cancela el evento: deja de aceptar inscripciones pero conserva su historial. */
    @Transactional
    public EventoResponse cancelar(Long id, Authentication auth) {
        Evento evento = buscar(id);
        verificarDueno(evento, auth);
        evento.setEstado("CANCELADO");
        return eventoMapper.toResponse(eventoRepository.save(evento));
    }

    /** Solo se puede eliminar un evento sin inscritos; si ya tiene, se debe cancelar. */
    @Transactional
    public void eliminar(Long id, Authentication auth) {
        Evento evento = buscar(id);
        verificarDueno(evento, auth);
        if (evento.getInscritos() != null && evento.getInscritos() > 0) {
            throw new IllegalStateException(
                    "El evento tiene inscritos y no se puede eliminar; cancélalo en su lugar");
        }
        eventoRepository.delete(evento);
    }

    private Evento buscar(Long id) {
        return eventoRepository.findByIdConCategoria(id)
                .orElseThrow(() -> new NoSuchElementException("Evento no encontrado con id: " + id));
    }

    /** Autorización a nivel de objeto: solo el dueño del evento (o un ADMIN) puede modificarlo. */
    private void verificarDueno(Evento evento, Authentication auth) {
        if (esAdmin(auth)) return;
        if (evento.getOrganizadorCorreo() == null
                || !evento.getOrganizadorCorreo().equalsIgnoreCase(auth.getName())) {
            throw new AccessDeniedException("Solo el organizador que creó el evento puede modificarlo");
        }
    }

    private boolean esAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private Categoria buscarCategoriaOLanzarError(Long categoriaId) {
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new NoSuchElementException("Categoría no encontrada con id: " + categoriaId));
    }
}
