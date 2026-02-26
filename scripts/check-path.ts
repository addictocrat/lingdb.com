import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    const res = await sql`SHOW search_path`;
    console.log('Search path:', res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
