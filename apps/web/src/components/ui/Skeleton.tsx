import { cn } from '@/utils/cn';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps): React.JSX.Element {
  return <div className={cn('bg-shimmer animate-shimmer rounded-2xl', className)} />;
}
