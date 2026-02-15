import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type BaseProps = {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
};

type FormInputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type FormSelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;
type FormTextAreaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FormInput({ label, hint, error, className, ...props }: FormInputProps): React.JSX.Element {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{label}</span>
      <input
        className={cn(
          'tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 py-2 text-sm text-text outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
          error && 'border-brand-700 focus:border-brand-700 focus:ring-brand-700/30',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-brand-700">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-brand-700/80">{hint}</p> : null}
    </label>
  );
}

export function FormTextArea({
  label,
  hint,
  error,
  className,
  ...props
}: FormTextAreaProps): React.JSX.Element {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{label}</span>
      <textarea
        className={cn(
          'w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 py-2 text-sm text-text outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
          error && 'border-brand-700 focus:border-brand-700 focus:ring-brand-700/30',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-brand-700">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-brand-700/80">{hint}</p> : null}
    </label>
  );
}

export function FormSelect({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: FormSelectProps): React.JSX.Element {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{label}</span>
      <select
        className={cn(
          'tap-target min-h-11 w-full rounded-2xl border border-surface/80 bg-surface/80 px-3 py-2 text-sm text-text outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
          error && 'border-brand-700 focus:border-brand-700 focus:ring-brand-700/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-brand-700">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-brand-700/80">{hint}</p> : null}
    </label>
  );
}
