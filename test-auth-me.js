const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcodyepxxowlhoippasw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bKcqJI62KQZ0i_pPvvQB7A_VLE2igUK';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users[0];

  // Try admin client
  const { data: adminData } = await supabase
        .from('usuarios_restaurantes')
        .select('restaurante_id, rol, restaurantes(id, nombre, slug, estado_suscripcion)')
        .eq('usuario_id', user.id);
  console.log("Admin Data:", JSON.stringify(adminData, null, 2));
}
test();
