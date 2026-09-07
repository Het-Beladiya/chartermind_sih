import React from 'react';

export interface CharterMindLogoProps {
  variant?: 'icon' | 'horizontal' | 'stacked' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  tone?: 'dark' | 'light';
  animated?: boolean;
  loading?: boolean;
  className?: string;
}

export const CharterMindLogo: React.FC<CharterMindLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  tone = 'dark',
  animated = false,
  loading = false,
  className = '',
}) => {
  // Alias 'full' to 'stacked' lockup
  const effectiveVariant = variant === 'full' ? 'stacked' : variant;

  // Asset selection based on background tone ('dark' text for light panels, 'light' text for dark panels)
  const isLightTone = tone === 'light';
  const iconSrc = '/logo.png';
  const wordmarkFullSrc = isLightTone ? '/wordmark-light.svg' : '/wordmark.svg';
  const wordmarkTextSrc = isLightTone ? '/wordmark-text-light.svg' : '/wordmark-text.svg';

  // Dimension scale for icon-only variant
  const iconOnlySizes: Record<string, number> = {
    xs: 32,
    sm: 44,
    md: 56,
    lg: 72,
    xl: 96,
    '2xl': 130,
  };

  // Dimension scale for horizontal row variant (Icon + Wordmark side-by-side, no tagline)
  const horizontalScale: Record<string, { icon: number; textHeight: number; gap: string }> = {
    xs: { icon: 28, textHeight: 13, gap: 'gap-2' },
    sm: { icon: 34, textHeight: 15, gap: 'gap-2' },
    md: { icon: 42, textHeight: 18, gap: 'gap-2.5' },
    lg: { icon: 52, textHeight: 23, gap: 'gap-3' },
    xl: { icon: 68, textHeight: 29, gap: 'gap-3.5' },
    '2xl': { icon: 88, textHeight: 38, gap: 'gap-4' },
  };

  // Dimension scale for stacked column variant (Icon on top, Wordmark + Tagline below)
  const stackedScale: Record<string, { icon: number; wordmarkWidth: number; gap: string }> = {
    xs: { icon: 44, wordmarkWidth: 78, gap: 'gap-1.5' },
    sm: { icon: 58, wordmarkWidth: 104, gap: 'gap-2' },
    md: { icon: 72, wordmarkWidth: 130, gap: 'gap-2.5' },
    lg: { icon: 90, wordmarkWidth: 160, gap: 'gap-3' },
    xl: { icon: 114, wordmarkWidth: 200, gap: 'gap-3.5' },
    '2xl': { icon: 150, wordmarkWidth: 260, gap: 'gap-4' },
  };

  const animClass = loading
    ? 'animate-breathe'
    : animated
    ? 'hover:scale-[1.02] transition-transform duration-300 ease-out'
    : '';

  // 1. Icon Only
  if (effectiveVariant === 'icon') {
    const dim = iconOnlySizes[size] || 44;
    return (
      <div className={`inline-flex items-center justify-center select-none bg-transparent ${animClass} ${className}`}>
        <img
          src={iconSrc}
          alt="CharterMind"
          width={dim}
          height={dim}
          className="shrink-0 select-none object-contain aspect-square"
          style={{ width: `${dim}px`, height: `${dim}px` }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 2. Stacked (Icon on top, Wordmark + Tagline centered directly below)
  if (effectiveVariant === 'stacked') {
    const cfg = stackedScale[size] || stackedScale.md;
    return (
      <div
        className={`inline-flex flex-col items-center justify-center text-center select-none bg-transparent ${cfg.gap} ${animClass} ${className}`}
      >
        <img
          src={iconSrc}
          alt="CharterMind"
          width={cfg.icon}
          height={cfg.icon}
          className="select-none object-contain aspect-square shrink-0"
          style={{ width: `${cfg.icon}px`, height: `${cfg.icon}px` }}
          referrerPolicy="no-referrer"
        />
        <img
          src={wordmarkFullSrc}
          alt="CharterMind — Predict, Optimize, Charter Smarter"
          width={cfg.wordmarkWidth}
          className="select-none object-contain max-w-full h-auto"
          style={{ width: `${cfg.wordmarkWidth}px` }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // 3. Horizontal (Icon on left, Wordmark text only on right, vertically centered)
  const hCfg = horizontalScale[size] || horizontalScale.md;
  return (
    <div
      className={`inline-flex items-center select-none bg-transparent ${hCfg.gap} ${animClass} ${className}`}
    >
      <img
        src={iconSrc}
        alt="CharterMind"
        width={hCfg.icon}
        height={hCfg.icon}
        className="shrink-0 select-none object-contain aspect-square"
        style={{ width: `${hCfg.icon}px`, height: `${hCfg.icon}px` }}
        referrerPolicy="no-referrer"
      />
      <img
        src={wordmarkTextSrc}
        alt="CharterMind — Predict, Optimize, Charter Smarter"
        height={hCfg.textHeight}
        className="select-none object-contain shrink-0"
        style={{ height: `${hCfg.textHeight}px`, width: 'auto' }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};


