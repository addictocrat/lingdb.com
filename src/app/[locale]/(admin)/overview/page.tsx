import { db } from '@/lib/db/client';
import { users, dictionaries, words } from '@/lib/db/schema';
import { count, desc } from 'drizzle-orm';
import { 
  Users, 
  BookOpen, 
  Type, 
  TrendingUp 
} from 'lucide-react';

export default async function AdminOverviewPage() {
  // Fetch stats in parallel
  const [
    [{ userCount }],
    [{ dictCount }],
    [{ wordCount }],
    recentUsers
  ] = await Promise.all([
    db.select({ userCount: count() }).from(users),
    db.select({ dictCount: count() }).from(dictionaries),
    db.select({ wordCount: count() }).from(words),
    db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 5,
    })
  ]);

  const stats = [
    { label: 'Total Users', value: userCount, icon: Users, color: 'text-blue-500' },
    { label: 'Total Dictionaries', value: dictCount, icon: BookOpen, color: 'text-green-500' },
    { label: 'Total Words', value: wordCount, icon: Type, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">System Overview</h1>
        <p className="text-[var(--fg)]/60">Comprehensive stats for Lingdb.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-[var(--fg)]/60">{stat.label}</p>
                <p className="mt-1 text-4xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div className={`rounded-xl bg-[var(--bg)] p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users Table */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6">
          <h2 className="mb-4 text-2xl font-bold">Recent Signups</h2>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)]/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 font-bold uppercase">
                    {user.username.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-[var(--fg)]/50">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium uppercase tracking-wider text-[var(--fg)]/40">Joined</p>
                  <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Chart Placeholder */}
        <div className="flex flex-col justify-center items-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--surface)] p-6 text-center">
          <TrendingUp className="h-12 w-12 text-[var(--fg)]/20 mb-4" />
          <h3 className="text-xl font-semibold">Activity Trends</h3>
          <p className="text-lg text-[var(--fg)]/60 mt-1 max-w-[200px]">Advanced charts and metrics coming soon.</p>
        </div>
      </div>
    </div>
  );
}
