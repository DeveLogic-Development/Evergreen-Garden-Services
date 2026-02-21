import { useState } from 'react';

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'lg';
};

const configuredLogoUrl = import.meta.env.VITE_LOGO_URL?.trim();
const defaultLogoUrl = '/images/logoEGS.png';

function PlaceholderMark({ size }: { size: 'sm' | 'lg' }): React.JSX.Element {
  const markClass = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl';

  return (
    <span className={`relative inline-flex items-center justify-center bg-surface/85 ${markClass}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-[72%] w-[72%]">
        <path d="M17 57L50 30L83 57" fill="none" stroke="currentColor" strokeWidth="8" className="text-brand-700" />
        <path d="M31 53V76H69V53" fill="currentColor" className="text-brand-500" />
        <path
          d="M50 13C41 20 36 30 36 41C36 52 41 62 50 69C59 62 64 52 64 41C64 30 59 20 50 13Z"
          fill="currentColor"
          className="text-accent-500"
        />
        <path
          d="M50 22C44 28 41 35 41 41C41 47 44 54 50 60C56 54 59 47 59 41C59 35 56 28 50 22Z"
          fill="currentColor"
          className="text-brand-800"
        />
      </svg>
    </span>
  );
}

export function BrandLogo({ className = '', showText = true, size = 'sm' }: BrandLogoProps): React.JSX.Element {
  const [imageError, setImageError] = useState(false);
  const markClass = size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const logoUrl = configuredLogoUrl || defaultLogoUrl;

  return (
    <div className={['flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      {
        // Replace this by setting VITE_LOGO_URL. Defaults to /images/logoEGS.png.
        !imageError ? (
          <img
            src={logoUrl}
            alt="Evergreen Garden Services"
            className={`object-contain ${markClass}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <PlaceholderMark size={size} />
        )
      }
      {showText ? (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-brand-900">Evergreen</p>
          <p className="text-xs text-brand-700">Garden Services</p>
        </div>
      ) : null}
    </div>
  );
}
