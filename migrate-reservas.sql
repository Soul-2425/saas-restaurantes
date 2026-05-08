-- Migrate reservas table to support public reservations with client contact info
ALTER TABLE reservas 
  ADD COLUMN IF NOT EXISTS nombre_cliente text,
  ADD COLUMN IF NOT EXISTS email_cliente  text,
  ADD COLUMN IF NOT EXISTS telefono_cliente text,
  ADD COLUMN IF NOT EXISTS fecha          date,
  ADD COLUMN IF NOT EXISTS hora           time without time zone,
  ADD COLUMN IF NOT EXISTS personas       integer,
  ADD COLUMN IF NOT EXISTS notas          text;

-- Backfill: copy existing data from old columns where possible
UPDATE reservas 
SET 
  nombre_cliente = cliente_nombre,
  personas       = cantidad_personas,
  fecha          = fecha_hora::date,
  hora           = fecha_hora::time
WHERE nombre_cliente IS NULL AND cliente_nombre IS NOT NULL;
