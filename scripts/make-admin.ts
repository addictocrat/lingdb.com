import { db } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin(email: string) {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'ADMIN' })
      .where(eq(users.email, email))
      .returning();

    if (updatedUser) {
      console.log(`Successfully promoted ${email} to ADMIN.`);
    } else {
      console.error(`User with email ${email} not found.`);
    }
  } catch (error) {
    console.error('Error promoting user:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Please provide an email: pnpm ts-node scripts/make-admin.ts user@example.com');
  process.exit(1);
}

makeAdmin(email);
