CREATE UNIQUE INDEX uq_pagos_un_activo_por_inscripcion
ON pagos (inscripcion_id)
WHERE estado IN ('PENDING', 'APPROVED');
