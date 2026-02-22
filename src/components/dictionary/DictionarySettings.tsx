'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Globe, Lock, Trash2, Check, X, Search, UserMinus, UserPlus } from 'lucide-react';
import type { Dictionary, DictionaryEditor } from '@/lib/db/schema';
import { useDebounce } from 'use-debounce';

interface DictionarySettingsProps {
  dictionary: Dictionary & {
    dictionaryEditors?: (DictionaryEditor & { user: { username: string } })[];
  };
  isOwner: boolean;
  onUpdate: () => void;
}

export default function DictionarySettings({
  dictionary,
  isOwner,
  onUpdate,
}: DictionarySettingsProps) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  const [editTitle, setEditTitle] = useState(dictionary.title);
  const [editDescription, setEditDescription] = useState(dictionary.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editors state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<{ id: string; username: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editors, setEditors] = useState(dictionary.dictionaryEditors || []);

  useEffect(() => {
    setEditors(dictionary.dictionaryEditors || []);
  }, [dictionary.dictionaryEditors]);

  useEffect(() => {
    async function searchUsers() {
      if (debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
    searchUsers();
  }, [debouncedSearch]);

  const handleSaveGeneral = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/dictionaries/${dictionary.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editTitle.trim(),
          description: editDescription.trim() || null
        }),
      });
      if (res.ok) {
        toast('Settings saved successfully', 'success');
        onUpdate();
      } else {
        toast('Failed to save settings', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublic = async () => {
    const res = await fetch(`/api/dictionaries/${dictionary.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !dictionary.isPublic }),
    });
    if (res.ok) onUpdate();
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/dictionaries/${dictionary.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast('Dictionary deleted', 'success');
      router.push(`/${locale}/dashboard`);
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      const res = await fetch(`/api/dictionaries/${dictionary.id}/editors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast('Invitation sent!', 'success');
        setSearchQuery('');
        // Optimistic update
        const invitedUser = searchResults.find(u => u.id === userId);
        if (invitedUser) {
          setEditors([...editors, { 
            id: 'temp', 
            dictionaryId: dictionary.id, 
            userId, 
            status: 'PENDING', 
            user: invitedUser,
            inviteToken: null,
            createdAt: new Date(),
            updatedAt: new Date()
          } as any]);
        }
      } else {
        toast(data.error || 'Failed to invite user', 'error');
      }
    } catch (error) {
      toast('Something went wrong', 'error');
    }
  };

  const handleRemoveEditor = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this editor? They will lose access to add or edit words.')) return;
    
    try {
      const res = await fetch(`/api/dictionaries/${dictionary.id}/editors/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast('Editor removed', 'success');
        setEditors(editors.filter(e => e.userId !== userId));
      } else {
        toast('Failed to remove editor', 'error');
      }
    } catch (error) {
      toast('Something went wrong', 'error');
    }
  };

  const handleQuit = async () => {
    if (!confirm('Are you sure you want to quit this dictionary? You will lose access, but your words will remain.')) return;
    try {
      // The backend uses the same endpoint for both owners removing and editors quitting
      const res = await fetch(`/api/dictionaries/${dictionary.id}/editors/me`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast('You left the dictionary', 'success');
        router.push(`/${locale}/dashboard`);
      }
    } catch (error) {
      toast('Something went wrong', 'error');
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* General Settings */}
      {isOwner && (
        <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6">
          <h2 className="mb-4 text-xl font-bold">General Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--fg)]/70">
                Title
              </label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-2 focus:border-primary-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--fg)]/70">
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-2 min-h-[100px] focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <div>
                <p className="font-medium">Visibility</p>
                <p className="text-sm text-[var(--fg)]/60">
                  {dictionary.isPublic 
                    ? "Anyone can view and fork this dictionary. Excellent for sharing your learning."
                    : "Only you and your editors can see this dictionary."}
                </p>
              </div>
              <Button
                variant={dictionary.isPublic ? "secondary" : "primary"}
                onClick={handleTogglePublic}
                className="min-w-[120px]"
              >
                {dictionary.isPublic ? (
                  <><Lock className="mr-2 h-4 w-4" /> Make Private</>
                ) : (
                  <><Globe className="mr-2 h-4 w-4" /> Make Public</>
                )}
              </Button>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Co-Editors Section */}
      <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 text-xl font-bold">Co-Editors</h2>
        
        {isOwner ? (
          <>
            <p className="mb-4 text-sm text-[var(--fg)]/70">
              Invite other users to collaborate on this dictionary. Editors can add, edit, and delete words.
            </p>

            {/* Invite Search */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg)]/40" />
                <input
                  type="text"
                  placeholder="Search users by username to invite..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] pl-10 pr-3 py-2.5 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface)] shadow-lg overflow-hidden">
                  {isSearching ? (
                    <div className="p-3 text-center text-sm text-[var(--fg)]/50">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto">
                      {searchResults.map((user) => {
                        const isAlreadyEditor = editors.some(e => e.userId === user.id);
                        return (
                          <li key={user.id} className="flex items-center justify-between px-4 py-2 hover:bg-[var(--bg)] border-b border-[var(--border-color)] last:border-0">
                            <span className="font-medium">{user.username}</span>
                            <Button 
                              size="sm" 
                              variant={isAlreadyEditor ? 'ghost' : 'primary'}
                              disabled={isAlreadyEditor}
                              onClick={() => handleInvite(user.id)}
                            >
                              {isAlreadyEditor ? (
                                <><Check className="mr-1 h-3 w-3" /> Invited</>
                              ) : (
                                <><UserPlus className="mr-1 h-3 w-3" /> Invite</>
                              )}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-sm text-[var(--fg)]/50">No users found matching "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Editors List */}
            <div className="space-y-3">
              <h3 className="font-medium text-[var(--fg)]/80">Current Editors</h3>
              {editors.length === 0 ? (
                <p className="text-sm text-[var(--fg)]/50 italic">No co-editors have been added yet.</p>
              ) : (
                <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-lg">
                  {editors.map((editor) => (
                    <div key={editor.id} className="flex items-center justify-between p-3 bg-[var(--bg)]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
                          {editor.user?.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{editor.user?.username || 'Unknown User'}</p>
                          <p className="text-xs text-[var(--fg)]/50">
                            {editor.status === 'PENDING' ? 'Invitation Sent (Pending)' : 'Accepted'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveEditor(editor.userId)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4">You are an editor of this shared dictionary.</p>
            <Button variant="danger" onClick={handleQuit}>
              Quit Dictionary
            </Button>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      {isOwner && (
        <section className="rounded-2xl border border-red-200 p-6 dark:border-red-900/30 bg-[var(--surface)]">
          <h2 className="mb-2 text-xl font-bold text-red-600 dark:text-red-200">Danger Zone</h2>
          <p className="mb-4 text-sm text-red-600/80 dark:text-red-200/80">
            Once you delete a dictionary, there is no going back. Please be certain.
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Dictionary
          </Button>
        </section>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Dictionary"
        size="sm"
      >
        <p className="mb-6 text-lg text-[var(--fg)]/60">
          This will permanently delete <strong>{dictionary.title}</strong> and
          all its words. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
