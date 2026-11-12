-- Dueño del evento: correo del organizador que lo creó (viene del JWT).
-- Los eventos de ejemplo quedan sin dueño y solo un ADMIN puede modificarlos.
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS organizador_correo VARCHAR(150);
CREATE INDEX IF NOT EXISTS idx_eventos_organizador_correo ON eventos (organizador_correo);
