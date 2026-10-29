CREATE UNIQUE INDEX uq_inscripciones_estudiante_evento
ON inscripciones (estudiante_correo, evento_id);
