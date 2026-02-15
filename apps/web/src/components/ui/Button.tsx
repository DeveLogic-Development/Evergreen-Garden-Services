import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant | undefined;
  fullWidth?: boolean | undefined;
};

const styles: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-text-invert border border-brand-700 active:scale-[0.99] hover:bg-brand-600 shadow-glass',
  secondary:
    'bg-surface/75 text-brand-800 border border-brand-300 hover:bg-surface/90 active:scale-[0.99]',
  accent:
    'bg-accent-500 text-brand-900 border border-accent-600 hover:bg-accent-600 active:scale-[0.99]',
  ghost: 'bg-surface/35 text-brand-800 border border-surface/70 hover:bg-surface/55 active:scale-[0.99]',
  danger: 'bg-brand-900 text-text-invert border border-brand-900 hover:bg-brand-800 active:scale-[0.99]',
};

export function AppButton({
  className,
  fullWidth,
  variant = 'primary',
  type = 'button',
  ...props
}: AppButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn(
        'tap-target inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-60',
        styles[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
}

export function PrimaryButton(props: Omit<AppButtonProps, 'variant'>): React.JSX.Element {
  return <AppButton variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<AppButtonProps, 'variant'>): React.JSX.Element {
  return <AppButton variant="secondary" {...props} />;
}
