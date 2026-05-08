const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcodyepxxowlhoippasw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bKcqJI62KQZ0i_pPvvQB7A_VLE2igUK';
const s = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

s.from('usuarios_restaurantes')
 .select('restaurante_id, rol, restaurantes(id, nombre, slug, estado_suscripcion)')
 .eq('usuario_id', 'b29043fa-7f93-4a56-b488-37d83935621e')
 .then(r => console.log(JSON.stringify(r.data, null, 2)));
