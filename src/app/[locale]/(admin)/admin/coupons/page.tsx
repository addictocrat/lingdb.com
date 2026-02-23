'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Calendar, Users as UsersIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    maxUses: 1,
    expiresAt: '',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      });
      if (res.ok) {
        setNewCoupon({ code: '', maxUses: 1, expiresAt: '' });
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to create coupon:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Coupon Management</h1>
        <p className="text-[var(--fg)]/60">Create and manage premium coupon codes.</p>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold flex items-center gap-2">
          <Plus className="h-6 w-6 text-primary-500" />
          Create New Coupon
        </h2>
        <form onSubmit={handleCreateCoupon} className="grid gap-6 sm:grid-cols-4 items-end">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1">Coupon Code</label>
            <input
              type="text"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              placeholder="E.g. PREMIUM1MONTH"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1">Max Uses</label>
            <input
              type="number"
              min="1"
              value={newCoupon.maxUses}
              onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium mb-1">Expires At (Optional)</label>
            <input
              type="date"
              value={newCoupon.expiresAt}
              onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="sm:col-span-1">
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">Existing Coupons</h2>
        {isLoading ? (
          <div className="py-12 text-center text-[var(--fg)]/50 italic">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-[var(--fg)]/50 italic">No coupons found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Uses</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg)]/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-primary-500">{coupon.code}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-[var(--fg)]/40" />
                        <span>{coupon.usedCount} / {coupon.maxUses}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--fg)]/40" />
                        <span>{coupon.expiresAt ? format(new Date(coupon.expiresAt), 'MMM d, yyyy') : 'Never'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
