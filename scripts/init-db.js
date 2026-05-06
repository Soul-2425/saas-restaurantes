const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar .env.local manualmente
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value.length > 0) {
            process.env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
    console.error('Error: SUPABASE_DB_URL no está definida en .env.local');
    process.exit(1);
}

const sql = `
-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLA: restaurantes
-- ==========================================
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    estado_suscripcion TEXT DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. TABLA: usuarios (Referencia a auth.users)
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TABLA: usuarios_restaurantes (Bridge / RBAC)
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios_restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    rol TEXT CHECK (rol IN ('dueño', 'supervisor', 'empleado')),
    UNIQUE(usuario_id, restaurante_id)
);

-- ==========================================
-- 4. TABLA: productos
-- ==========================================
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    precio NUMERIC(12, 6) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    categoria TEXT,
    es_por_tiempo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. TABLA: mesas
-- ==========================================
CREATE TABLE IF NOT EXISTS mesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    capacidad INTEGER DEFAULT 4,
    estado TEXT DEFAULT 'disponible',
    tipo_espacio TEXT CHECK (tipo_espacio IN ('comedor', 'billar', 'vip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. TABLA: reservas
-- ==========================================
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    cliente_nombre TEXT NOT NULL,
    cantidad_personas INTEGER DEFAULT 1,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. TABLA: pedidos
-- ==========================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    nombre_cliente_barra TEXT,
    total NUMERIC(12, 6) DEFAULT 0,
    estado TEXT DEFAULT 'abierto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CONFIGURACIÓN DE RLS (Row Level Security)
-- ==========================================
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Función para verificar pertenencia al tenant (restaurante)
CREATE OR REPLACE FUNCTION public.check_tenant_access(r_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_restaurantes
        WHERE restaurante_id = r_id
        AND usuario_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es dueño de un restaurante
CREATE OR REPLACE FUNCTION public.is_tenant_owner(r_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.usuarios_restaurantes
        WHERE restaurante_id = r_id
        AND usuario_id = auth.uid()
        AND rol = 'dueño'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS RLS

-- Restaurantes: Usuarios solo ven restaurantes donde trabajan
CREATE POLICY "Select_Restaurantes_Tenant" ON restaurantes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios_restaurantes WHERE restaurante_id = id AND usuario_id = auth.uid())
    );

-- Productos: CRUD solo si pertenece al restaurante
CREATE POLICY "Tenant_Access_Productos" ON productos
    FOR ALL USING (check_tenant_access(restaurante_id))
    WITH CHECK (check_tenant_access(restaurante_id));

-- Mesas: CRUD solo si pertenece al restaurante
CREATE POLICY "Tenant_Access_Mesas" ON mesas
    FOR ALL USING (check_tenant_access(restaurante_id))
    WITH CHECK (check_tenant_access(restaurante_id));

-- Reservas: CRUD solo si pertenece al restaurante
CREATE POLICY "Tenant_Access_Reservas" ON reservas
    FOR ALL USING (check_tenant_access(restaurante_id))
    WITH CHECK (check_tenant_access(restaurante_id));

-- Pedidos: CRUD solo si pertenece al restaurante
CREATE POLICY "Tenant_Access_Pedidos" ON pedidos
    FOR ALL USING (check_tenant_access(restaurante_id))
    WITH CHECK (check_tenant_access(restaurante_id));

-- Usuarios: Solo acceso propio
CREATE POLICY "Self_Access_Usuarios" ON usuarios
    FOR ALL USING (id = auth.uid());

-- Usuarios_Restaurantes: Solo acceso si eres parte del restaurante
CREATE POLICY "Tenant_Access_Bridge" ON usuarios_restaurantes
    FOR ALL USING (
        usuario_id = auth.uid() OR 
        public.is_tenant_owner(restaurante_id)
    );
`;

async function runMigration() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('--- Iniciando Migración FASE 1 ---');
        await client.connect();
        console.log('✅ Conexión exitosa a Supabase.');

        console.log('⏳ Ejecutando script de esquema...');
        await client.query(sql);
        console.log('✅ Esquema y políticas RLS creadas correctamente.');

    } catch (err) {
        console.error('❌ Error durante la migración:', err);
    } finally {
        await client.end();
        console.log('--- Proceso Finalizado ---');
    }
}

runMigration();
