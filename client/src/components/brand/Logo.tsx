import React from 'react';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/fonts';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge-only' | 'badge-with-title' | 'compact';
  portalName?: string;
  themeMode?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

/**
 * Logo — Excellent Web World Brand Mark
 *
 * Uses the generated EW monogram image as the icon chip.
 * Wordmark "Excellent Web World" + optional portal sub-label sit beside it.
 *
 * Image: /logo.jpg — blue rounded-square app icon with white EW monogram
 */
export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'badge-with-title',
  portalName = 'Workforce & Performance Portal',
  // themeMode prop kept in interface for API compatibility but not needed for image-based logo
  onClick,
}) => {
  const cfg = {
    sm: { badge: 36, wordmarkSize: '0.88rem', subSize: '0.68rem', gap: '10px' },
    md: { badge: 46, wordmarkSize: '1.05rem', subSize: '0.74rem', gap: '12px' },
    lg: { badge: 56, wordmarkSize: '1.28rem', subSize: '0.82rem', gap: '14px' },
    xl: { badge: 70, wordmarkSize: '1.55rem', subSize: '0.92rem', gap: '18px' },
  }[size];

  /* On the light hero, text is always dark navy */
  const wordmarkColor = COLORS.neutral.textPrimary;
  const subColor      = COLORS.primary.main;

  /* ── Logo image chip ── */
  const LogoImg = (
    <img
      src="/logo.jpg"
      alt="Excellent Web World"
      width={cfg.badge}
      height={cfg.badge}
      style={{
        display: 'block',
        width: cfg.badge,
        height: cfg.badge,
        minWidth: cfg.badge,
        borderRadius: '22%',          /* keeps the rounded-square look at every size */
        objectFit: 'cover',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(24, 113, 247, 0.30)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    />
  );

  /* Badge-only / compact */
  if (variant === 'badge-only' || variant === 'compact') {
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          cursor: onClick ? 'pointer' : 'default',
          borderRadius: '22%',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => {
          const img = (e.currentTarget as HTMLElement).querySelector('img');
          if (img) {
            img.style.transform = 'scale(1.06)';
            img.style.boxShadow = '0 6px 22px rgba(24,113,247,0.42)';
          }
        }}
        onMouseLeave={e => {
          const img = (e.currentTarget as HTMLElement).querySelector('img');
          if (img) {
            img.style.transform = 'scale(1)';
            img.style.boxShadow = '0 4px 16px rgba(24,113,247,0.30)';
          }
        }}
      >
        {LogoImg}
      </span>
    );
  }

  /* Full lockup: image + wordmark */
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: cfg.gap,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        textDecoration: 'none',
        maxWidth: '100%',
      }}
      onMouseEnter={e => {
        const img = (e.currentTarget as HTMLElement).querySelector('img');
        if (img) {
          img.style.transform = 'scale(1.06)';
          img.style.boxShadow = '0 8px 26px rgba(24,113,247,0.45)';
        }
      }}
      onMouseLeave={e => {
        const img = (e.currentTarget as HTMLElement).querySelector('img');
        if (img) {
          img.style.transform = 'scale(1)';
          img.style.boxShadow = '0 4px 16px rgba(24,113,247,0.30)';
        }
      }}
    >
      {LogoImg}

      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        {/* Primary wordmark */}
        <span
          style={{
            fontFamily: FONT_FAMILY.brand,
            fontSize: cfg.wordmarkSize,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            color: wordmarkColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Excellent Web World
        </span>

        {/* Portal sub-label */}
        {portalName && (
          <span
            style={{
              fontFamily: FONT_FAMILY.brand,
              fontSize: cfg.subSize,
              lineHeight: 1.25,
              color: subColor,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {portalName}
          </span>
        )}
      </span>
    </span>
  );
};
