import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const supabaseId = 'a66321a5-a987-47b4-a9f0-3726c317479c';
  console.log(`Testing getDbUser for ${supabaseId}...`);
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, supabaseId),
    });
    console.log('Result:', JSON.stringify(user, null, 2));
    
    if (!user) {
      console.log('User not found via Drizzle query.');
    } else {
      console.log('User found! hasCompletedDictTour:', user.hasCompletedDictTour);
    }
  } catch (error) {
    console.error('Drizzle Error:', error);
  } finally {
    process.exit(0);
  }
}

main();
