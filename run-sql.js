const { Client } = require('pg');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let SUPABASE_DB_URL = '';
envFile.split(/\r?\n/).forEach(line => {
    const [key, ...value] = line.split('=');
    if (key === 'SUPABASE_DB_URL' && value.length > 0) {
        SUPABASE_DB_URL = value.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

async function run() {
  const client = new Client({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const sql = fs.readFileSync('update-roles.sql', 'utf8');
  try {
    await client.query(sql);
    console.log('Roles check constraint updated.');
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
