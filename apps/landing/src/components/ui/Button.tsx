import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type SharedProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function variantClasses(variant: NonNullable<SharedProps['variant']>): string {
  if (variant === 'secondary') {
    return 'border border-surface/75 bg-surface/65 text-brand-900 hover:bg-surface/80';
  }
  if (variant === 'ghost') {
    return 'border border-brand-300 bg-brand-300/10 text-brand-800 hover:bg-brand-300/20';
  }
  return 'border border-brand-700 bg-brand-700 text-text-invert hover:bg-brand-600';
}

function sharedClass(variant: NonNullable<SharedProps['variant']>, className?: string): string {
  return [
    'tap-target inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
    'active:scale-[0.98]',
    variantClasses(variant),
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function AppButton({ variant = 'primary', className, children, ...props }: ButtonProps): React.JSX.Element {
  return (
    <button className={sharedClass(variant, className)} {...props}>
      {children}
    </button>
  );
}

export function AppLinkButton({ variant = 'primary', className, children, ...props }: LinkProps): React.JSX.Element {
  return (
    <a className={sharedClass(variant, className)} {...props}>
      {children}
    </a>
  );
}
