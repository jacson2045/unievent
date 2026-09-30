package pe.edu.upeu.evento.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.upeu.evento.dto.CategoriaRequest;
import pe.edu.upeu.evento.dto.CategoriaResponse;
import pe.edu.upeu.evento.entity.Categoria;
import pe.edu.upeu.evento.mapper.CategoriaMapper;
import pe.edu.upeu.evento.repository.CategoriaRepository;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final CategoriaMapper categoriaMapper;

    public List<CategoriaResponse> listar() {
        return categoriaRepository.findAll()
                .stream()
                .map(categoriaMapper::toResponse)
                .toList();
    }

    public CategoriaResponse obtenerPorId(Long id) {
        Categoria categoria = buscarOLanzarError(id);
        return categoriaMapper.toResponse(categoria);
    }

    public CategoriaResponse crear(CategoriaRequest request) {
        Categoria categoria = categoriaMapper.toEntity(request);
        return categoriaMapper.toResponse(categoriaRepository.save(categoria));
    }

    public CategoriaResponse actualizar(Long id, CategoriaRequest request) {
        Categoria categoria = buscarOLanzarError(id);
        categoria.setNombre(request.getNombre());
        categoria.setDescripcion(request.getDescripcion());
        return categoriaMapper.toResponse(categoriaRepository.save(categoria));
    }

    public void eliminar(Long id) {
        Categoria categoria = buscarOLanzarError(id);
        categoriaRepository.delete(categoria);
    }

    private Categoria buscarOLanzarError(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Categoría no encontrada con id: " + id));
    }
}