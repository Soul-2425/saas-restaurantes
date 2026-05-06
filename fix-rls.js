const { Client } = require('pg');

const sql = `
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

DROP POLICY IF EXISTS "Tenant_Access_Bridge" ON usuarios_restaurantes;

CREATE POLICY "Tenant_Access_Bridge" ON usuarios_restaurantes
    FOR ALL USING (
        usuario_id = auth.uid() OR 
        public.is_tenant_owner(restaurante_id)
    );
`;

const client = new Client({
    connectionString: "postgresql://postgres.vcodyepxxowlhoippasw:Therosegroupemmaturbotoñocj@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    try {
        await client.connect();
        await client.query(sql);
        console.log("SUCCESS: RLS policy fixed!");
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await client.end();
    }
}
fix();
