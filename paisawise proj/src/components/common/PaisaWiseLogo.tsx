import React, { useState } from 'react';
import { Wallet } from 'lucide-react';

export interface PaisaWiseLogoProps {
  /**
   * 'compact': icon-sized mark for compact mobile headers and small spaces
   * 'sidebar': sidebar header logo with brand wordmark and tagline
   * 'full': prominent branded presentation for landing/onboarding screens
   * 'mark-only': standalone logo image with responsive sizing and no text
   */
  variant?: 'compact' | 'sidebar' | 'full' | 'mark-only';
  className?: string;
  imageClassName?: string;
  showTagline?: boolean;
}

// Target logo paths: primary provided filename and standard fallback
const PRIMARY_LOGO_SRC = '/PaisaWise_Wallet_Growth_Logo-removebg-preview.png';
const FALLBACK_LOGO_SRC = '/logo.png';

export const PaisaWiseLogo: React.FC<PaisaWiseLogoProps> = ({
  variant = 'sidebar',
  className = '',
  imageClassName = '',
  showTagline = true,
}) => {
  const [srcIndex, setSrcIndex] = useState<number>(0);
  const sources = [PRIMARY_LOGO_SRC, FALLBACK_LOGO_SRC];
  const [hasError, setHasError] = useState<boolean>(false);

  const handleImageError = () => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setHasError(true);
    }
  };

  // Render the logo graphic (image with contain, or graceful branded fallback if file not yet uploaded)
  const renderLogoImage = (sizeClasses: string) => {
    if (hasError) {
      return (
        <div
          className={`${sizeClasses} rounded-xl bg-[#4C3478] flex items-center justify-center text-[#42CBA5] shadow-xs shrink-0 select-none`}
          aria-label="PaisaWise logo"
        >
          <Wallet className="w-5 h-5 text-[#42CBA5]" />
        </div>
      );
    }

    return (
      <div className={`${sizeClasses} flex items-center justify-center shrink-0 overflow-hidden`}>
        <img
          src={sources[srcIndex]}
          alt="PaisaWise logo"
          onError={handleImageError}
          className={`w-full h-full object-contain max-h-full transition-transform duration-200 ${imageClassName}`}
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        {renderLogoImage('w-8 h-8 md:w-9 md:h-9')}
      </div>
    );
  }

  if (variant === 'mark-only') {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        {renderLogoImage(imageClassName || 'w-10 h-10')}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {renderLogoImage('w-10 h-10 md:w-12 md:h-12')}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl md:text-2xl text-[#29233A] tracking-tight">
              PaisaWise
            </span>
            <span className="text-xs text-[#4C3478] font-bold bg-[#EDE7FF] px-2 py-0.5 rounded-md">
              Student Finance
            </span>
          </div>
          {showTagline && (
            <p className="text-xs text-[#777187] font-medium">Your money, made clearer.</p>
          )}
        </div>
      </div>
    );
  }

  // Default: sidebar variant
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {renderLogoImage('w-10 h-10')}
      <div className="flex flex-col min-w-0">
        <span className="font-extrabold text-lg text-[#29233A] tracking-tight truncate">
          PaisaWise
        </span>
        {showTagline && (
          <span className="text-xs text-[#777187] font-normal truncate">
            Your money, made clearer
          </span>
        )}
      </div>
    </div>
  );
};
