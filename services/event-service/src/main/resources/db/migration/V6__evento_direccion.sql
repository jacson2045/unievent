-- Dirección del lugar del evento (se usa para mostrar el mapa y "Cómo llegar").
-- Es opcional: si está vacía, el frontend busca el lugar dentro de la universidad.
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);
