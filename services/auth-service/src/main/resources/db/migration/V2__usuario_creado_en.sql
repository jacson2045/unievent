-- Fecha de registro del usuario (se muestra como "Miembro desde" en el perfil).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP NOT NULL DEFAULT now();
