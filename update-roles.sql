ALTER TABLE usuarios_restaurantes DROP CONSTRAINT IF EXISTS usuarios_restaurantes_rol_check;
ALTER TABLE usuarios_restaurantes ADD CONSTRAINT usuarios_restaurantes_rol_check CHECK (rol IN ('dueño', 'supervisor', 'empleado', 'mesero', 'cliente'));
