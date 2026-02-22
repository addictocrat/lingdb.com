import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import UserManagementClient from '@/components/admin/UserManagementClient';

export default async function AdminUsersPage() {
  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
        <p className="text-[var(--fg)]/60">View and manage all Lingdb accounts.</p>
      </div>

      <UserManagementClient initialUsers={allUsers} />
    </div>
  );
}
