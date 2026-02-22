import { cn } from '@/lib/utils/cn';
import { BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionId?: string;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionId,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className
      )}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20">
        <BookOpen className="h-10 w-10 text-primary-400" />
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-lg text-[var(--fg)]/50">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button id={actionId} onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
