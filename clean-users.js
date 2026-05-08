const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcodyepxxowlhoippasw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bKcqJI62KQZ0i_pPvvQB7A_VLE2igUK';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${users.length} users.`);
  
  for (const user of users) {
    if (user.email === 'solcarsaro1111@gmail.com') {
      console.log(`Skipping superadmin: ${user.email}`);
      continue;
    }
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`Error deleting ${user.email}:`, delErr.message);
    } else {
      console.log(`Deleted user: ${user.email}`);
    }
  }
  
  // We should also delete restaurants created by them, but since ON DELETE CASCADE is on `usuarios` and `usuarios_restaurantes`, the restaurant might be orphaned.
  // Let's delete all restaurants where the owner is NOT solcarsaro1111@gmail.com? 
  // No, just delete all restaurants except the ones connected to solcarsaro1111@gmail.com.
  
  const { data: myRest } = await supabase.from('usuarios_restaurantes')
    .select('restaurante_id')
    .eq('usuario_id', users.find(u => u.email === 'solcarsaro1111@gmail.com')?.id);
    
  const myRestIds = myRest ? myRest.map(r => r.restaurante_id) : [];
  
  if (myRestIds.length > 0) {
    const { error: rErr } = await supabase.from('restaurantes').delete().not('id', 'in', `(${myRestIds.join(',')})`);
    if (rErr) console.error('Error deleting orphaned restaurants:', rErr);
    else console.log('Cleaned up orphaned restaurants.');
  } else {
    // delete all if none
    await supabase.from('restaurantes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Deleted all restaurants.');
  }
  
  console.log('Cleanup complete.');
}
cleanUsers();
