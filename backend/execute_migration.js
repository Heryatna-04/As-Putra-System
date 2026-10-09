const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const migrationPath = path.resolve(__dirname, '../database/migrations/004_create_bookings_table.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

const client = new Client({
  connectionString: 'postgresql://postgres.esvwatrnlqgcnvjtebmr:asputrarahmat@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Running migration 004_create_bookings_table.sql...');
    await client.query(sql);
    console.log('SQL Migration applied successfully!');

    // 1. Verify columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);
    console.log('\n--- Bookings Table Columns ---');
    console.table(columnsRes.rows);

    // 2. Verify roles
    const rolesRes = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid 
      WHERE typname = 'profile_role';
    `);
    console.log('\n--- profile_role Enum Values ---');
    console.log(rolesRes.rows.map(r => r.enumlabel));

    // 3. Reload schema cache for PostgREST
    await client.query('NOTIFY pgrst, \'reload schema\';');
    console.log('\nPostgREST schema cache reloaded!');

  } catch (err) {
    console.error('Error executing migration:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
