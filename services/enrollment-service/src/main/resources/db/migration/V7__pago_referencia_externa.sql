-- Referencia que se envía a Mercado Pago (external_reference) y con la que luego se
-- busca el pago. Antes se usaba el id de la tabla: al reiniciar la base de datos los ids
-- se repiten y un pago nuevo podía "encontrar" un pago aprobado antiguo de la misma cuenta
-- de Mercado Pago. Ahora es un UUID único por pago.
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS referencia_externa VARCHAR(64);

-- Pagos existentes: sus preferencias ya se crearon con el id como referencia.
UPDATE pagos SET referencia_externa = id::text WHERE referencia_externa IS NULL;

ALTER TABLE pagos ALTER COLUMN referencia_externa SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_referencia_externa ON pagos (referencia_externa);
