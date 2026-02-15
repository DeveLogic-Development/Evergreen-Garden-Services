import { cn } from '@/utils/cn';

type StepperProps = {
  steps: string[];
  current: number;
};

export function Stepper({ steps, current }: StepperProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full transition',
                index <= current ? 'bg-brand-700' : 'bg-surface/70',
              )}
            />
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </div>
  );
}
