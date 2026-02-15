import type { ButtonHTMLAttributes } from 'react';
import { AppButton } from '@/components/ui/Button';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({ variant = 'primary', fullWidth, ...props }: ButtonProps): React.JSX.Element {
  return <AppButton variant={variant} fullWidth={fullWidth} {...props} />;
}
