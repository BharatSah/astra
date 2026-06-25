import pg from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const projectRef = 'afkllzfkeyacejcooxcl';
const host = 'aws-1-ap-southeast-2.pooler.supabase.com';
const port = 5432;
const database = 'postgres';
const user = `postgres.${projectRef}`;

console.log('\n🚀 Astra Cloud Database Migrator');
console.log('----------------------------------------');
console.log(`Connecting to database pooler for project: ${projectRef}`);

rl.question('\nEnter your Supabase Database Password: ', (password) => {
  if (!password) {
    console.error('Error: Password cannot be empty.');
    rl.close();
    process.exit(1);
  }

  // Construct Connection URI
  const connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('\nConnecting to PostgreSQL database...');

  client.connect(async (err) => {
    if (err) {
      console.error('\n❌ Connection failed!');
      console.error(err.message);
      console.log('\nMake sure your password is correct and your internet connection is active.');
      rl.close();
      process.exit(1);
    }

    console.log('✅ Connected successfully!');

    try {
      const schemaPath = path.join(__dirname, '../supabase/schema.sql');
      console.log(`Reading SQL script from: ${schemaPath}...`);
      const sql = fs.readFileSync(schemaPath, 'utf8');

      console.log('Executing database schema DDL migrations...');
      await client.query(sql);

      console.log('\n🎉 Database migrations applied successfully!');
      console.log('The tables, indexes, rules, and mock data have been seeded in your cloud instance.');
    } catch (queryErr) {
      console.error('\n❌ Migration execution failed!');
      console.error(queryErr.message);
    } finally {
      await client.end();
      rl.close();
    }
  });
});
