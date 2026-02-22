'use client';

import { useState } from 'react';
import { User } from '@/lib/db/schema';
import { 
  Search, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert,
  Users,
  Mail
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      
      setUsers(users.filter(u => u.id !== id));
      toast('User deleted successfully', 'success');
    } catch (error) {
      toast('Failed to delete user', 'error');
    }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change ${user.username}'s role to ${newRole}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, { 
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to update role');

      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole as any } : u));
      toast(`User promoted to ${newRole}`, 'success');
    } catch (error) {
      toast('Failed to update role', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
        <input
          type="text"
          placeholder="Search by username or email..."
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-2 pl-10 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
        <table className="w-full text-left text-lg">
          <thead className="bg-[var(--bg)]/50 text-[var(--fg)]/60 font-medium">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-[var(--bg)]/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 font-bold">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--fg)]">{user.username}</p>
                      <p className="text-sm text-[var(--fg)]/40">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {user.role === 'ADMIN' ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    user.isDeleted ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {user.isDeleted ? 'Deleted' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--fg)]/60">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => toggleRole(user)}
                      className="p-2 text-[var(--fg)]/40 hover:text-primary-500 transition-colors"
                      title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                    >
                      {user.role === 'ADMIN' ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                    <button 
                      className="p-2 text-[var(--fg)]/40 hover:text-blue-500 transition-colors"
                      title="Send Email"
                      onClick={() => window.location.href = `mailto:${user.email}`}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-[var(--fg)]/40 hover:text-red-500 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[var(--fg)]/40">No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
