INSERT INTO categorias (nombre, descripcion)
SELECT v.nombre, v.descripcion
FROM (VALUES
    ('Tecnologia', 'Charlas, talleres y hackathons de Tecnologia'),
    ('Académico', 'Congresos, seminarios y jornadas académicas'),
    ('Cultural', 'Música, arte, teatro y actividades culturales'),
    ('Deportes', 'Torneos y actividades deportivas'),
    ('Emprendimiento', 'Ferias, pitch y networking de negocios')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.nombre = v.nombre);

INSERT INTO eventos (nombre, descripcion, descripcion_corta, fecha, fecha_fin, lugar,
                     capacidad, precio, estado, modalidad, organizador, requisitos, tags, id_categoria)
SELECT v.nombre, v.descripcion, v.corta, NOW() + v.inicio, NOW() + v.fin, v.lugar,
       v.capacidad, v.precio, 'ACTIVO', v.modalidad, v.organizador, v.requisitos, v.tags,
       (SELECT id FROM categorias WHERE nombre = v.categoria)
FROM (VALUES
    ('Hackathon UPeU 2026', 'Maratón de programación de 24 horas para resolver retos reales con equipos multidisciplinarios.',
     'Maratón de programación de 24 horas', INTERVAL '10 days', INTERVAL '11 days', 'Auditorio Central',
     100, 25.00, 'PRESENCIAL', 'Facultad de Ingeniería', 'Laptop propia', 'hackathon,programacion,equipos', 'Tecnologia'),
    ('Taller de Microservicios con Spring Boot', 'Taller práctico de arquitectura de microservicios, API Gateway y Circuit Breaker.',
     'Taller práctico de microservicios', INTERVAL '15 days', INTERVAL '15 days 4 hours', 'Laboratorio 3',
     40, 15.00, 'PRESENCIAL', 'Escuela de Sistemas', 'Conocimientos básicos de Java', 'spring,microservicios,java', 'Tecnologia'),
    ('Congreso de Investigación Científica', 'Presentación de trabajos de investigación de estudiantes y docentes.',
     'Presentación de trabajos de investigación', INTERVAL '30 days', INTERVAL '31 days', 'Aula Magna',
     200, 0.00, 'HIBRIDO', 'Vicerrectorado de Investigación', NULL, 'investigacion,ciencia', 'Académico'),
    ('Noche Cultural Universitaria', 'Música, danza y teatro con talentos de la universidad.',
     'Música, danza y teatro', INTERVAL '20 days', INTERVAL '20 days 5 hours', 'Patio Principal',
     300, 10.00, 'PRESENCIAL', 'Bienestar Universitario', NULL, 'cultura,musica,danza', 'Cultural'),
    ('Feria de Emprendimiento Juvenil', 'Stands de emprendedores, charlas y rueda de networking.',
     'Feria y networking de emprendedores', INTERVAL '25 days', INTERVAL '25 days 6 hours', 'Explanada',
     150, 5.00, 'PRESENCIAL', 'Incubadora UPeU', NULL, 'emprendimiento,negocios', 'Emprendimiento')
) AS v(nombre, descripcion, corta, inicio, fin, lugar, capacidad, precio, modalidad, organizador, requisitos, tags, categoria)
WHERE NOT EXISTS (SELECT 1 FROM eventos e WHERE e.nombre = v.nombre);