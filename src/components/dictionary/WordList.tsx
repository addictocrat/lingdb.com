"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { useTranslations } from "next-intl";
import {
  Pencil,
  Trash2,
  MessageSquare,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Word, ExamplePhrase } from "@/lib/db/schema";
import { deleteWord, reorderWords, updateWord } from "@/lib/api/words.api";

interface WordItemProps {
  word: Word & {
    examplePhrases?: ExamplePhrase[];
    lastModifiedBy?: { username: string } | null;
  };
  onUpdate: () => void;
  onDelete: () => void;
  onShowPhrases: (wordId: string) => void;
  canEdit: boolean;
}

function SortableWordItem({
  word,
  onUpdate,
  onDelete,
  onShowPhrases,
  canEdit,
}: WordItemProps) {
  const { toast } = useToast();
  const t = useTranslations("dictionary");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(word.title);
  const [editTranslation, setEditTranslation] = useState(word.translation);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const updateWordMutation = useMutation({
    mutationFn: (payload: { title: string; translation: string }) =>
      updateWord(word.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: () => deleteWord(word.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
    },
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: word.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editTranslation.trim()) return;

    try {
      await updateWordMutation.mutateAsync({
        title: editTitle.trim(),
        translation: editTranslation.trim(),
      });

      setIsEditing(false);
      onUpdate();
    } catch {
      toast(t("settings.error_saved"), "error");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWordMutation.mutateAsync();
      onDelete();
    } catch {
      toast(t("settings.error_saved"), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const phraseCount = word.examplePhrases?.length || 0;

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50/50 p-3 dark:border-primary-800 dark:bg-primary-900/10"
      >
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-2 py-1.5 text-lg focus:border-primary-500 focus:outline-none"
          autoFocus
        />
        <input
          value={editTranslation}
          onChange={(e) => setEditTranslation(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg)] px-2 py-1.5 text-lg focus:border-primary-500 focus:outline-none"
        />
        <button
          onClick={handleSave}
          className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditTitle(word.title);
            setEditTranslation(word.translation);
          }}
          className="rounded-lg p-1.5 text-[var(--fg)]/40 hover:bg-[var(--surface)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${
        isDragging
          ? "bg-[var(--surface)] shadow-md"
          : "hover:bg-[var(--surface)]"
      }`}
    >
      {canEdit ? (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-[var(--fg)]/20 hover:text-[var(--fg)]/50 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      ) : (
        <div className="w-7"></div>
      )}

      <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center">
        <span className="text-xl font-medium text-[var(--fg)]">
          {word.title}
        </span>
        <span className="hidden sm:inline-block mx-2 text-[var(--fg)]/20">
          →
        </span>
        <span className="text-xl  text-[var(--fg)]/60">{word.translation}</span>
        {word.lastModifiedBy && (
          <span className="ml-auto text-xs text-[var(--fg)]/40 italic">
            edited by {word.lastModifiedBy.username}
          </span>
        )}
      </div>

      <div
        className={`flex items-center gap-1 transition-opacity ${
          isDragging
            ? "opacity-0"
            : "opacity-100 group-hover:opacity-100 focus-within:opacity-100"
        }`}
      >
        <button
          onClick={() => onShowPhrases(word.id)}
          className="cursor-pointer flex gap-2 rounded-lg p-1.5 text-[var(--fg)]/40 hover:bg-primary-50 hover:text-primary-500 dark:hover:bg-primary-900/20"
          title={`${phraseCount} phrases`}
        >
          <MessageSquare className="h-5 w-5" />
          {phraseCount > 0 && (
            <span className="ml-0.5 text-sm font-semibold">{phraseCount}</span>
          )}
        </button>
        {canEdit && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="cursor-pointer rounded-lg p-1.5 text-[var(--fg)]/40 hover:bg-[var(--surface)] hover:text-[var(--fg)]"
              title="Edit"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer rounded-lg p-1.5 text-[var(--fg)]/40 hover:bg-accent-50 hover:text-accent-500 dark:hover:bg-accent-900/20"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface WordListProps {
  words: (Word & {
    examplePhrases?: ExamplePhrase[];
    lastModifiedBy?: { username: string } | null;
  })[];
  onUpdate: () => void;
  onShowPhrases: (wordId: string) => void;
  canEdit?: boolean;
}

export default function WordList({
  words: initialWords,
  onUpdate,
  onShowPhrases,
  canEdit = true,
}: WordListProps) {
  const { toast } = useToast();
  const t = useTranslations("dictionary");
  const [items, setItems] = useState(initialWords);
  const queryClient = useQueryClient();

  const reorderMutation = useMutation({
    mutationFn: reorderWords,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      await queryClient.invalidateQueries({ queryKey: ["dictionaries"] });
    },
  });

  useEffect(() => {
    setItems(initialWords);
  }, [initialWords]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before initiating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Map the new list to update order on the backend
        const updatePayload = newItems.map((item, index) => ({
          id: item.id,
          order: index,
        }));

        saveReorder(updatePayload);

        return newItems;
      });
    }
  };

  const saveReorder = async (updates: { id: string; order: number }[]) => {
    try {
      await reorderMutation.mutateAsync(updates);
    } catch {
      toast(t("settings.error_saved"), "error");
      onUpdate();
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-xl text-[var(--fg)]/40">
        {t("no_words")}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-[var(--border-color)] p-2">
          {items.map((word) => (
            <SortableWordItem
              key={word.id}
              word={word}
              onUpdate={onUpdate}
              onDelete={onUpdate}
              onShowPhrases={onShowPhrases}
              canEdit={canEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
