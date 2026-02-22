import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

type InputState = 'default' | 'error' | 'success';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: InputState;
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const stateStyles: Record<InputState, string> = {
  default:
    'border-[var(--border-color)] focus:border-primary-500 focus:ring-primary-500/20',
  error:
    'border-accent-400 focus:border-accent-500 focus:ring-accent-500/20',
  success:
    'border-green-400 focus:border-green-500 focus:ring-green-500/20',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, state = 'default', label, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-lg font-medium text-[var(--fg)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg)]/40">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-[var(--surface)] py-3 text-lg transition-all duration-200 focus:outline-none focus:ring-2',
              icon ? 'pl-10 pr-4' : 'px-4',
              stateStyles[state],
              className
            )}
            {...props}
          />
        </div>
        {hint && (
          <p
            className={cn(
              'text-sm',
              state === 'error' ? 'text-accent-500' : 'text-[var(--fg)]/40'
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
