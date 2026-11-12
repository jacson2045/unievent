-- Asistencia por QR: cada inscripción tiene un código único que el estudiante presenta
-- en la entrada; fecha_asistencia queda registrada cuando el organizador lo escanea.
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS codigo_asistencia VARCHAR(20);
ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS fecha_asistencia TIMESTAMP;

-- Inscripciones existentes: se les asigna un código.
UPDATE inscripciones
SET codigo_asistencia = 'UEP-' || upper(substr(md5(random()::text || id::text), 1, 8))
WHERE codigo_asistencia IS NULL;

ALTER TABLE inscripciones ALTER COLUMN codigo_asistencia SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_inscripciones_codigo_asistencia ON inscripciones (codigo_asistencia);
