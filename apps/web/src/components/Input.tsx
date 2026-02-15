import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FormInput, FormTextArea } from '@/components/ui/Input';

type SharedProps = {
  label: string;
  hint?: string;
  error?: string | undefined;
};

type InputProps = SharedProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = SharedProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Input({ label, hint, error, ...props }: InputProps): React.JSX.Element {
  return <FormInput label={label} hint={hint} error={error} {...props} />;
}

export function TextArea({ label, hint, error, ...props }: TextareaProps): React.JSX.Element {
  return <FormTextArea label={label} hint={hint} error={error} {...props} />;
}
