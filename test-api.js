const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcodyepxxowlhoippasw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bKcqJI62KQZ0i_pPvvQB7A_VLE2igUK';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) { console.error('Error users:', uErr); return; }
  
  if (!users || users.length === 0) { console.log('No users found'); return; }
  
  const user = users[0];
  console.log('Testing with user:', user.email, user.id);

  const { data: ur, error: urErr } = await supabase
    .from('usuarios_restaurantes')
    .select('*')
    .eq('usuario_id', user.id);
    
  console.log('User restaurants (admin query):', ur, urErr);
  
  // also get the restaurant
  if (ur && ur.length > 0) {
    const rId = ur[0].restaurante_id;
    const { data: r, error: rErr } = await supabase.from('restaurantes').select('*').eq('id', rId);
    console.log('Restaurante:', r, rErr);
  }
}
test();
