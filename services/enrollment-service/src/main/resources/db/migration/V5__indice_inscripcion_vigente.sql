DROP INDEX IF EXISTS uq_inscripciones_estudiante_evento;

CREATE UNIQUE INDEX uq_inscripciones_estudiante_evento_vigente
ON inscripciones (estudiante_correo, evento_id)
WHERE estado <> 'CANCELADA';