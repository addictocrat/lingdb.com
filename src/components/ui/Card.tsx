import { cn } from '@/lib/utils/cn';

type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[var(--surface)] border border-[var(--border-color)]',
  elevated:
    'bg-[var(--surface)] border border-[var(--border-color)] shadow-lg shadow-black/5 dark:shadow-black/20',
  outlined: 'bg-transparent border-2 border-[var(--border-color)]',
};

export default function Card({
  className,
  variant = 'default',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-200',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xl font-semibold', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-lg text-[var(--fg)]/70', className)} {...props}>
      {children}
    </div>
  );
}
