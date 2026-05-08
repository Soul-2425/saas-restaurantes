const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcodyepxxowlhoippasw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bKcqJI62KQZ0i_pPvvQB7A_VLE2igUK';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function test() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users[0];
  const { data: u } = await supabase.from('usuarios').select('*').eq('id', user.id);
  console.log("Usuarios row:", u);
}
test();
