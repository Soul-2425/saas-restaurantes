const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar .env.local manualmente
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim().replace(/^["']|["']$/g, '');
  });
}

const sql = `
-- ==========================================
-- MIGRACIÓN FASE 2: Pagos, Items y Config
-- ==========================================

-- 1. Tabla de ítems de pedido (faltaba en Fase 1)
CREATE TABLE IF NOT EXISTS pedidos_items (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id        UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id      UUID REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto  TEXT NOT NULL,
    precio_unitario  NUMERIC(12,6) NOT NULL,
    cantidad         INTEGER NOT NULL DEFAULT 1,
    subtotal         NUMERIC(12,6) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED,
    notas            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE pedidos_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant_Access_PedidosItems" ON pedidos_items;
CREATE POLICY "Tenant_Access_PedidosItems" ON pedidos_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM pedidos p
                WHERE p.id = pedido_id AND check_tenant_access(p.restaurante_id))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM pedidos p
                WHERE p.id = pedido_id AND check_tenant_access(p.restaurante_id))
    );

-- 2. Columnas de pago en pedidos (flujo auditoría multi-moneda)
ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS moneda            TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS metodo_pago       TEXT,
    ADD COLUMN IF NOT EXISTS estado_pago       TEXT NOT NULL DEFAULT 'sin_pago',
    ADD COLUMN IF NOT EXISTS referencia_pago   TEXT,
    ADD COLUMN IF NOT EXISTS monto_recibido    NUMERIC(12,6),
    ADD COLUMN IF NOT EXISTS verificado_por    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verificado_en     TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS notas_verificacion TEXT;

-- Constraint de estados de pago válidos
ALTER TABLE pedidos
    DROP CONSTRAINT IF EXISTS chk_estado_pago;
ALTER TABLE pedidos
    ADD CONSTRAINT chk_estado_pago
    CHECK (estado_pago IN ('sin_pago','pendiente_verificacion','pagado','rechazado'));

-- Constraint de métodos de pago válidos
ALTER TABLE pedidos
    DROP CONSTRAINT IF EXISTS chk_metodo_pago;
ALTER TABLE pedidos
    ADD CONSTRAINT chk_metodo_pago
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo','tarjeta','transferencia','cripto','otro'));

-- 3. Configuración por tenant (monedas, tasas de cambio)
CREATE TABLE IF NOT EXISTS configuracion_restaurante (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id      UUID UNIQUE NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    monedas_aceptadas   TEXT[] NOT NULL DEFAULT ARRAY['USD'],
    moneda_base         TEXT NOT NULL DEFAULT 'USD',
    tasas_cambio        JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE configuracion_restaurante ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant_Access_Config" ON configuracion_restaurante;
CREATE POLICY "Tenant_Access_Config" ON configuracion_restaurante
    FOR ALL USING (check_tenant_access(restaurante_id))
    WITH CHECK (check_tenant_access(restaurante_id));

-- 4. Habilitar Supabase Realtime en tablas operativas
ALTER PUBLICATION supabase_realtime ADD TABLE mesas;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos_items;
ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
`;

async function runMigration() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    console.log('--- Iniciando Migración FASE 2 ---');
    await client.connect();
    console.log('✅ Conexión exitosa.');
    await client.query(sql);
    console.log('✅ Migración completada: pedidos_items, columnas de pago, configuracion_restaurante y Realtime habilitado.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('--- Proceso Finalizado ---');
  }
}

runMigration();
