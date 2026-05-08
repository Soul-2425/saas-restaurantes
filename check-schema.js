const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let SUPABASE_DB_URL = '';
envFile.split(/\r?\n/).forEach(line => {
  const [key, ...value] = line.split('=');
  if (key === 'SUPABASE_DB_URL' && value.length > 0)
    SUPABASE_DB_URL = value.join('=').trim().replace(/^["']|["']$/g, '');
});

async function run() {
  const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const r = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='reservas' ORDER BY ordinal_position`);
  console.log('Columnas de reservas:');
  r.rows.forEach(c => console.log(' -', c.column_name, ':', c.data_type));
  await client.end();
}
run();
