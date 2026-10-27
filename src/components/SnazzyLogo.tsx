import React, { useState } from 'react';

interface SnazzyLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  subtextColor?: string;
  subtitle?: string;
}

export const SnazzyLogo: React.FC<SnazzyLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  textColor = 'text-[#00224D] dark:text-white',
  subtextColor = 'text-slate-500 dark:text-slate-400',
  subtitle,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 'w-8 h-8', text: 'text-lg', sub: 'text-[11px]' },
    lg: { icon: 'w-10 h-10', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Logo Image from /public/slogo.png */}
      {!imgError ? (
        <img
          src="/slogo.png"
          alt="Snazzy Operations"
          className={`${currentSize.icon} object-contain shrink-0`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Brand Geometric 'S' SVG Fallback */
        <svg
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentSize.icon} shrink-0`}
        >
          {/* Top Orange Ribbon */}
          <polygon points="20,32 80,0 80,24 0,66" fill="#ED8231" />
          <polygon points="0,34 20,32 0,66" fill="#AD5E1F" />

          {/* Middle Blue Ribbon */}
          <polygon points="0,58 42,76 42,102 0,76" fill="#005CBD" />
          <polygon points="58,41 100,60 100,83 72,100 58,72" fill="#0051B8" />
          <polygon points="72,100 100,83 100,102 72,118" fill="#60A5FA" opacity="0.8" />

          {/* Bottom Dark Navy Ribbon */}
          <polygon points="20,93 100,51 100,70 20,120" fill="#00224D" />
          <polygon points="20,93 20,120 0,110" fill="#001C42" />
        </svg>
      )}

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-bold tracking-tight ${currentSize.text} ${textColor}`}>
            Snazzy <span className="text-[#005CBD]">Operations</span>
          </div>
          {subtitle && (
            <div className={`font-medium ${currentSize.sub} ${subtextColor} uppercase tracking-wider`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
