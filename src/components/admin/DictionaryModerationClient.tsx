'use client';

import { useState } from 'react';
import { Dictionary } from '@/lib/db/schema';
import { 
  Search, 
  Trash2, 
  Eye, 
  EyeOff,
  ExternalLink,
  BookOpen,
  Settings
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import AdminSeoEditor from './AdminSeoEditor';

type ModerationDictionary = Dictionary & {
  user: { username: string; email: string };
  words: { id: string }[];
};

export default function DictionaryModerationClient({ initialDictionaries }: { initialDictionaries: ModerationDictionary[] }) {
  const { toast } = useToast();
  const [dicts, setDicts] = useState(initialDictionaries);
  const [search, setSearch] = useState('');
  const [seoEditingId, setSeoEditingId] = useState<string | null>(null);
  const locale = useLocale();

  const filteredDicts = dicts.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.user.username.toLowerCase().includes(search.toLowerCase()) ||
    d.language.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dictionary and all its words?')) return;

    try {
      const res = await fetch(`/api/admin/dictionaries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setDicts(dicts.filter(d => d.id !== id));
      toast('Dictionary deleted', 'success');
    } catch (error) {
      toast('Failed to delete', 'error');
    }
  };

  const togglePublic = async (dict: ModerationDictionary) => {
    const isPublic = !dict.isPublic;
    try {
      const res = await fetch(`/api/admin/dictionaries/${dict.id}/visibility`, { 
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to update');

      setDicts(dicts.map(d => d.id === dict.id ? { ...d, isPublic } : d));
      toast(`Dictionary is now ${isPublic ? 'Public' : 'Private'}`, 'success');
    } catch (error) {
      toast('Failed to update visibility', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg)]/40" />
        <input
          type="text"
          placeholder="Search by title, user, or language..."
          className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--surface)] py-2 pl-10 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Dictionaries Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface)]">
        <table className="w-full text-left text-lg">
          <thead className="bg-[var(--bg)]/50 text-[var(--fg)]/60 font-medium">
            <tr>
              <th className="px-6 py-4">Dictionary</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Visibility</th>
              <th className="px-6 py-4">Stats</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredDicts.map((dict) => (
              <>
                <tr key={dict.id} className={`transition-colors hover:bg-[var(--bg)]/30 ${seoEditingId === dict.id ? 'bg-amber-500/5' : ''}`}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-[var(--fg)]">{dict.title}</p>
                    <p className="text-sm uppercase text-[var(--fg)]/40 tracking-wider font-bold">{dict.language}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{dict.user.username}</p>
                    <p className="text-sm text-[var(--fg)]/40">{dict.user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                    dict.isPublic ? 'bg-green-500/10 text-green-500' : 'bg-[var(--fg)]/5 text-[var(--fg)]/50'
                  }`}>
                    {dict.isPublic ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {dict.isPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--fg)]/60">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {dict.words.length} words
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setSeoEditingId(seoEditingId === dict.id ? null : dict.id)}
                      className={`p-2 transition-colors ${seoEditingId === dict.id ? 'text-amber-500' : 'text-[var(--fg)]/40 hover:text-amber-500'}`}
                      title="Manage SEO"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => togglePublic(dict)}
                      className="p-2 text-[var(--fg)]/40 hover:text-primary-500 transition-colors"
                      title={dict.isPublic ? 'Make Private' : 'Make Public'}
                    >
                      {dict.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Link 
                      href={`/${locale}/library/${dict.id}`}
                      target="_blank"
                      className="p-2 text-[var(--fg)]/40 hover:text-blue-500 transition-colors"
                      title="View Public Page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(dict.id)}
                      className="p-2 text-[var(--fg)]/40 hover:text-red-500 transition-colors"
                      title="Delete Dictionary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {seoEditingId === dict.id && (
                <tr key={`${dict.id}-seo`} className="bg-amber-500/5">
                  <td colSpan={5} className="px-6 pb-6 pt-0">
                    <AdminSeoEditor 
                      dictionaryId={dict.id}
                      currentSeoTitle={dict.seoTitle}
                      currentSeoDescription={dict.seoDescription}
                      seoGeneratedAt={dict.seoGeneratedAt?.toISOString() || (dict.seoGeneratedAt as unknown as string) || null}
                    />
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
        
        {filteredDicts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[var(--fg)]/40">No dictionaries found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
