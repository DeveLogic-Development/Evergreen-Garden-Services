import { cn } from '@/utils/cn';

const DEFAULT_LOGO_URL = '/images/logo.svg';

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'lg' | 'xl';
};

export function BrandLogo({ className, showText = true, size = 'sm' }: BrandLogoProps): React.JSX.Element {
  const isLarge = size === 'lg' || size === 'xl';
  const imageSizeClass =
    size === 'xl' ? 'h-28.5 w-28.5 sm:h-28 sm:w-28' : isLarge ? 'h-20 w-20' : 'h-9 w-9';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={DEFAULT_LOGO_URL}
        alt="Evergreen Garden Services"
        className={cn('rounded-xl object-contain', imageSizeClass)}
      />
      {showText ? (
        <div className="leading-tight">
          <p className={cn('font-semibold text-brand-900', isLarge ? 'text-base' : 'text-sm')}>Evergreen</p>
          <p className={cn('text-brand-700', isLarge ? 'text-sm' : 'text-xs')}>Garden Services</p>
        </div>
      ) : null}
    </div>
  );
}
