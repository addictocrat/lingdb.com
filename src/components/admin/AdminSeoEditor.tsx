"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { RefreshCw, Save, ChevronDown, ChevronUp } from "lucide-react";
import { updateDictionary } from "@/lib/api/dictionaries.api";
import { generateDictionarySeo } from "@/lib/api/ai.api";

interface AdminSeoEditorProps {
  dictionaryId: string;
  currentSeoTitle: string | null;
  currentSeoDescription: string | null;
  seoGeneratedAt: string | null;
}

export default function AdminSeoEditor({
  dictionaryId,
  currentSeoTitle,
  currentSeoDescription,
  seoGeneratedAt,
}: AdminSeoEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [seoTitle, setSeoTitle] = useState(currentSeoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    currentSeoDescription || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const saveSeoMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateDictionary(dictionaryId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dictionaries"],
      });
    },
  });

  const regenerateSeoMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      generateDictionarySeo(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "dictionaries"],
      });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSeoMutation.mutateAsync({ seoTitle, seoDescription });
      toast("SEO metadata saved successfully!", "success");
    } catch (error) {
      toast("Failed to save SEO metadata", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const data = await regenerateSeoMutation.mutateAsync({
        dictionaryId,
        force: true,
      });
      setSeoTitle(data.seoTitle || "");
      setSeoDescription(data.seoDescription || "");
      toast("SEO metadata regenerated!", "success");
    } catch (error) {
      toast("Failed to regenerate SEO metadata", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
            🔧 Admin: SEO Settings
          </span>
          {seoGeneratedAt && (
            <span className="text-sm text-[var(--fg)]/40">
              Generated: {new Date(seoGeneratedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-amber-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--fg)]/70">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="CTR-optimized title for search engines..."
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2.5 text-[var(--fg)] placeholder:text-[var(--fg)]/30 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--fg)]/70">
              SEO Description (Rich HTML)
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="<h2>Learn French Medical Terms</h2><p>This dictionary covers <strong>essential</strong> health vocabulary...</p>"
              rows={8}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg)] px-4 py-2.5 font-mono text-sm text-[var(--fg)] placeholder:text-[var(--fg)]/30 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* Preview */}
          {seoDescription && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--fg)]/70">
                Preview
              </label>
              <div
                className="rounded-xl border border-[var(--border-color)] bg-[var(--surface)] p-4 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: seoDescription }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="mr-1.5 h-4 w-4" />
              {isSaving ? "Saving..." : "Save SEO Fields"}
            </Button>
            <Button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              size="sm"
              variant="secondary"
            >
              <RefreshCw
                className={`mr-1.5 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
              />
              {isRegenerating ? "Regenerating..." : "Regenerate with AI"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
