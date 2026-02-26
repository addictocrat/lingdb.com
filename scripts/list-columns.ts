import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  console.log('Listing all columns in "users" table...');
  try {
    const columns = await sql`
      SELECT table_schema, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.log('Columns:', JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error listing columns:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
