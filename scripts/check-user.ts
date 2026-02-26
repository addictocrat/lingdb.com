import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const supabaseId = 'a66321a5-a987-47b4-a9f0-3726c317479c';
  console.log(`Checking if user ${supabaseId} exists...`);
  try {
    const users = await sql`SELECT id, email, username, supabase_id FROM users WHERE supabase_id = ${supabaseId}`;
    console.log('Results:', JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log('User NOT found. Total users in DB:');
      const allUsers = await sql`SELECT count(*) FROM users`;
      console.log(allUsers);
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

main();
