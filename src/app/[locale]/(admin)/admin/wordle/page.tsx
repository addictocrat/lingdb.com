"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Puzzle,
  Star,
  Loader2,
  HelpCircle,
  Hash,
  Activity,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import {
  listAdminWordles,
  createAdminWordle,
  toggleAdminWordleOfficial,
  deleteAdminWordle,
  type AdminWordleGame,
} from "@/lib/api/admin-wordle.api";
import { qk } from "@/lib/tanstack/query-keys";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/utils/constants";

export default function WordleAdminPage() {
  const queryClient = useQueryClient();
  const tLanguages = useTranslations("settings.languages");
  
  const [isCreating, setIsCreating] = useState(false);
  const [newGame, setNewGame] = useState({
    solution: "",
    language: "en" as SupportedLocale,
    noteToSolver: "",
    maxTries: 6,
  });

  const [langFilter, setLangFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: games = [], isLoading } = useQuery<AdminWordleGame[]>({
    queryKey: qk.admin.wordle,
    queryFn: async () => listAdminWordles() as unknown as AdminWordleGame[],
    staleTime: 30_000,
  });

  const createGameMutation = useMutation({
    mutationFn: createAdminWordle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.admin.wordle });
      setErrorMsg(null);
    },
  });

  const toggleOfficialMutation = useMutation({
    mutationFn: ({ id, isOfficial }: { id: string; isOfficial: boolean }) =>
      toggleAdminWordleOfficial(id, isOfficial),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.admin.wordle });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: deleteAdminWordle,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.admin.wordle });
    },
  });

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanWord = newGame.solution.trim().toUpperCase();
    if (!/^[A-Z\u00C0-\u00FF]+$/i.test(cleanWord)) {
      setErrorMsg("Word must contain only alphabetic letters.");
      return;
    }
    if (cleanWord.length < 3 || cleanWord.length > 12) {
      setErrorMsg("Word length must be between 3 and 12 letters.");
      return;
    }

    setIsCreating(true);
    try {
      await createGameMutation.mutateAsync({
        solution: cleanWord,
        language: newGame.language,
        noteToSolver: newGame.noteToSolver.trim() || undefined,
        maxTries: newGame.maxTries,
      });
      setNewGame({ solution: "", language: "en", noteToSolver: "", maxTries: 6 });
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to create game.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleOfficial = async (game: AdminWordleGame) => {
    try {
      await toggleOfficialMutation.mutateAsync({
        id: game.id,
        isOfficial: !game.isOfficial,
      });
    } catch (error) {
      console.error("Failed to toggle official status:", error);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game permanently?")) return;
    try {
      await deleteGameMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete game:", error);
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesLang = langFilter === "all" || game.language === langFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "official" && game.isOfficial) ||
      (statusFilter === "custom" && !game.isOfficial);
    return matchesLang && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <Puzzle className="h-10 w-10 text-[#0001d8]" />
          Yordle Management
        </h1>
        <p className="text-[var(--fg)]/60 font-medium">
          Create and manage official Yordle games for players. Set words as official to make them playable in random games.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold flex items-center gap-2">
          <Plus className="h-6 w-6 text-primary-500" />
          Create New Official Yordle Game
        </h2>
        <form onSubmit={handleCreateGame} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Language</label>
              <select
                value={newGame.language}
                onChange={(e) =>
                  setNewGame({
                    ...newGame,
                    language: e.target.value as SupportedLocale,
                  })
                }
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
              >
                {SUPPORTED_LOCALES.map((localeCode) => (
                  <option key={localeCode} value={localeCode}>
                    {tLanguages(localeCode)}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Secret Word</label>
              <input
                type="text"
                value={newGame.solution}
                onChange={(e) =>
                  setNewGame({
                    ...newGame,
                    solution: e.target.value.toUpperCase().replace(/[^a-zA-Z]/g, ""),
                  })
                }
                placeholder="E.g. CODES"
                maxLength={12}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold tracking-wider"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">Max Tries</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newGame.maxTries}
                onChange={(e) =>
                  setNewGame({
                    ...newGame,
                    maxTries: parseInt(e.target.value) || 6,
                  })
                }
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                required
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-semibold mb-1">&nbsp;</label>
              <Button type="submit" className="w-full h-[42px] cursor-pointer" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Game"}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Note to Solver (Optional)
            </label>
            <textarea
              value={newGame.noteToSolver}
              onChange={(e) =>
                setNewGame({ ...newGame, noteToSolver: e.target.value })
              }
              placeholder="Will only be shown to player after they successfully solve it."
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
            />
          </div>

          {errorMsg && (
            <div className="border border-red-300 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 rounded-lg">
              {errorMsg}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Yordle Game List</h2>
          <div className="flex flex-wrap gap-3">
            <div>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-sm"
              >
                <option value="all">All Languages</option>
                {SUPPORTED_LOCALES.map((localeCode) => (
                  <option key={localeCode} value={localeCode}>
                    {tLanguages(localeCode)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="official">Official Only</option>
                <option value="custom">Custom Only</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center text-[var(--fg)]/50 italic gap-2 items-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Yordle games...
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="py-12 text-center text-[var(--fg)]/50 italic">
            No Yordle games found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-left text-sm text-[var(--fg)]/60 font-semibold">
                  <th className="px-4 py-3">Secret Word</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <tr
                    key={game.id}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg)]/50 transition-colors text-base font-medium"
                  >
                    <td className="px-4 py-4 font-black tracking-wider text-[var(--fg)]">
                      {game.solution}
                    </td>
                    <td className="px-4 py-4">
                      {tLanguages(game.language as SupportedLocale)}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--fg)]/70">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-[var(--fg)]/40" />
                          <span>{game.wordLength} letters</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-[var(--fg)]/40" />
                          <span>{game.maxTries} max tries</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold select-none ${
                          game.isOfficial
                            ? "bg-green-500/10 text-green-500"
                            : "bg-neutral-500/10 text-[var(--fg)]/60"
                        }`}
                      >
                        {game.isOfficial ? "Official" : "Custom"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleOfficial(game)}
                          className={`rounded-lg p-2 transition-colors cursor-pointer ${
                            game.isOfficial
                              ? "text-yellow-500 hover:bg-yellow-500/10"
                              : "text-[var(--fg)]/30 hover:text-yellow-500 hover:bg-yellow-500/10"
                          }`}
                          title={game.isOfficial ? "Mark as Custom" : "Mark as Official"}
                        >
                          <Star className={`h-5 w-5 ${game.isOfficial ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete game"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
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
