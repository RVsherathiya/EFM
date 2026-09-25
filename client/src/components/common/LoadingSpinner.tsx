import React from 'react';
import { Box, Typography, SxProps, Theme, keyframes } from '@mui/material';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/fonts';

// Keyframe Animations
const ewSpin = keyframes`
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`;

const ewReverseSpin = keyframes`
  0% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
`;

const ewPulseBreathe = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(24, 113, 247, 0.35), 0 0 12px rgba(24, 113, 247, 0.2);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 14px 36px rgba(24, 113, 247, 0.65), 0 0 24px rgba(78, 162, 252, 0.45);
  }
`;

const ewRipple = keyframes`
  0% {
    transform: scale(0.85);
    opacity: 0.75;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: scale(1.85);
    opacity: 0;
  }
`;

const dotBounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
`;

export interface LoadingSpinnerProps {
  /** Optional message displayed below the animated logo */
  message?: string;
  /** Minimum container height (e.g. '200px', '400px', '100vh') */
  minHeight?: number | string;
  /** If true, renders a fixed full-screen overlay with blurred backdrop */
  fullScreen?: boolean;
  /** If true, positions absolutely over parent container with blurred backdrop */
  overlay?: boolean;
  /** Blur intensity in pixels (default: '12px' for fullscreen, '8px' for container) */
  blur?: number | string;
  /** Size in pixels of the center logo badge (default: 64) */
  logoSize?: number;
  /** Additional custom styles */
  sx?: SxProps<Theme>;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  minHeight = '200px',
  fullScreen = false,
  overlay = false,
  blur,
  logoSize = 64,
  sx,
}) => {
  const isFullScreen = fullScreen || minHeight === '100vh';
  const blurVal =
    typeof blur === 'number'
      ? `${blur}px`
      : blur || (isFullScreen ? '12px' : '8px');

  // SVG orbital spinner dimensions
  const trackDiameter = logoSize + 36;
  const outerDiameter = logoSize + 56;
  const trackRadius = trackDiameter / 2 - 3;
  const outerRadius = outerDiameter / 2 - 2;
  const trackCircumference = 2 * Math.PI * trackRadius;

  return (
    <Box
      sx={{
        ...(isFullScreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: (theme) => theme.zIndex.modal + 200,
            }
          : {
              position: overlay ? 'absolute' : 'relative',
              top: overlay ? 0 : 'auto',
              left: overlay ? 0 : 'auto',
              right: overlay ? 0 : 'auto',
              bottom: overlay ? 0 : 'auto',
              width: '100%',
              minHeight,
              zIndex: overlay ? 10 : 1,
              borderRadius: 2,
            }),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: `blur(${blurVal})`,
        WebkitBackdropFilter: `blur(${blurVal})`,
        transition: 'backdrop-filter 0.3s ease, background-color 0.3s ease',
        userSelect: 'none',
        ...sx,
      }}
    >
      {/* Centered Animated Loader Wrapper */}
      <Box
        sx={{
          position: 'relative',
          width: outerDiameter,
          height: outerDiameter,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outward Concentric Ripple Waves */}
        <Box
          sx={{
            position: 'absolute',
            width: logoSize,
            height: logoSize,
            borderRadius: '26%',
            border: `2px solid rgba(24, 113, 247, 0.45)`,
            background: `radial-gradient(circle, rgba(24, 113, 247, 0.12) 0%, rgba(24, 113, 247, 0) 70%)`,
            animation: `${ewRipple} 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: logoSize,
            height: logoSize,
            borderRadius: '26%',
            border: `1.5px solid rgba(24, 113, 247, 0.35)`,
            background: `radial-gradient(circle, rgba(24, 113, 247, 0.08) 0%, rgba(24, 113, 247, 0) 70%)`,
            animation: `${ewRipple} 2.4s cubic-bezier(0.2, 0.8, 0.2, 1) infinite 1.2s`,
            pointerEvents: 'none',
          }}
        />

        {/* Outer Counter-Rotating Dashed Orbit Ring */}
        <Box
          component="svg"
          width={outerDiameter}
          height={outerDiameter}
          viewBox={`0 0 ${outerDiameter} ${outerDiameter}`}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: `${ewReverseSpin} 14s linear infinite`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <circle
            cx={outerDiameter / 2}
            cy={outerDiameter / 2}
            r={outerRadius}
            fill="none"
            stroke="rgba(24, 113, 247, 0.22)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
        </Box>

        {/* Circular Background Track */}
        <Box
          component="svg"
          width={trackDiameter}
          height={trackDiameter}
          viewBox={`0 0 ${trackDiameter} ${trackDiameter}`}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <circle
            cx={trackDiameter / 2}
            cy={trackDiameter / 2}
            r={trackRadius}
            fill="none"
            stroke="rgba(24, 113, 247, 0.12)"
            strokeWidth="3.5"
          />
        </Box>

        {/* Orbiting Rotating Gradient Spinner Arc */}
        <Box
          component="svg"
          width={trackDiameter}
          height={trackDiameter}
          viewBox={`0 0 ${trackDiameter} ${trackDiameter}`}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: `${ewSpin} 1.25s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          <defs>
            <linearGradient id="ewLoaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={COLORS.primary.main} />
              <stop offset="50%" stopColor={COLORS.secondary.sky} />
              <stop offset="100%" stopColor={COLORS.primary.light} />
            </linearGradient>
          </defs>
          <circle
            cx={trackDiameter / 2}
            cy={trackDiameter / 2}
            r={trackRadius}
            fill="none"
            stroke="url(#ewLoaderGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${trackCircumference * 0.32} ${trackCircumference * 0.68}`}
          />
        </Box>

        {/* Centered Logo Badge */}
        <Box
          component="img"
          src="/logo.jpg"
          alt="Loading..."
          sx={{
            width: logoSize,
            height: logoSize,
            borderRadius: '22%',
            objectFit: 'cover',
            position: 'relative',
            zIndex: 4,
            animation: `${ewPulseBreathe} 2.4s ease-in-out infinite`,
            userSelect: 'none',
          }}
        />
      </Box>

      {/* Message & Animated Dots */}
      {message && (
        <Box
          sx={{
            mt: 3.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: FONT_FAMILY.brand,
              color: COLORS.neutral.textPrimary,
              fontWeight: 600,
              fontSize: '0.92rem',
              letterSpacing: '0.015em',
            }}
          >
            {message}
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '3px', ml: 0.5 }}>
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: COLORS.primary.main,
                animation: `${dotBounce} 1.4s infinite ease-in-out`,
                animationDelay: '0s',
              }}
            />
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: COLORS.primary.main,
                animation: `${dotBounce} 1.4s infinite ease-in-out`,
                animationDelay: '0.2s',
              }}
            />
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: COLORS.primary.main,
                animation: `${dotBounce} 1.4s infinite ease-in-out`,
                animationDelay: '0.4s',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Aliases for clear descriptive usage
export const CustomLoader = LoadingSpinner;
export const AnimatedLogoLoader = LoadingSpinner;
export const PageLoader: React.FC<Omit<LoadingSpinnerProps, 'fullScreen'>> = (props) => (
  <LoadingSpinner fullScreen {...props} />
);
