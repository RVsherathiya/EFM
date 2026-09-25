import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/fonts';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: COLORS.primary.main, // Excellent Web World Sky Blue
      light: COLORS.primary.light,
      dark: COLORS.primary.dark,
      contrastText: COLORS.neutral.textWhite,
    },
    secondary: {
      main: COLORS.secondary.main,
      light: COLORS.secondary.light,
      dark: COLORS.secondary.dark,
      contrastText: COLORS.neutral.textWhite,
    },
    info: {
      main: COLORS.feedback.info,
      light: COLORS.primary.tintLight,
      dark: COLORS.secondary.dark,
      contrastText: COLORS.neutral.textWhite,
    },
    success: {
      main: COLORS.feedback.success,
      light: COLORS.feedback.successLight,
      dark: COLORS.feedback.successDark,
      contrastText: COLORS.neutral.textWhite,
    },
    warning: {
      main: COLORS.feedback.warning,
      light: COLORS.feedback.warningLight,
      dark: COLORS.feedback.warningDark,
      contrastText: COLORS.neutral.textWhite,
    },
    error: {
      main: COLORS.feedback.error,
      light: COLORS.feedback.errorLight,
      dark: COLORS.feedback.errorDark,
      contrastText: COLORS.neutral.textWhite,
    },
    background: {
      default: COLORS.neutral.bgClean,
      paper: COLORS.neutral.bgWhite,
    },
    text: {
      primary: COLORS.neutral.textPrimary,
      secondary: COLORS.neutral.textSlate,
    },
    divider: COLORS.neutral.borderLight,
  },
  typography: {
    fontFamily: FONT_FAMILY.primary,
    h1: {
      fontFamily: FONT_FAMILY.heading,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: FONT_FAMILY.heading,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: FONT_FAMILY.heading,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: FONT_FAMILY.heading,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: FONT_FAMILY.heading,
    },
    h6: {
      fontFamily: FONT_FAMILY.heading,
    },
    subtitle1: {},
    subtitle2: {},
    button: {
      fontFamily: FONT_FAMILY.primary,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily: FONT_FAMILY.primary,
        },
        body: {
          fontFamily: FONT_FAMILY.primary,
        },
        'button, input, select, textarea': {
          fontFamily: FONT_FAMILY.primary,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_FAMILY.primary,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_FAMILY.primary,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          boxShadow: 'none',
          textTransform: 'none',
          fontFamily: FONT_FAMILY.primary,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: COLORS.gradients.primaryButton,
          color: COLORS.neutral.textWhite,
          boxShadow: '0 4px 16px rgba(24, 113, 247, 0.35)',
          '&:hover': {
            background: COLORS.gradients.primaryButtonHover,
            boxShadow: '0 8px 24px rgba(24, 113, 247, 0.45)',
            transform: 'translateY(-1.5px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlinedPrimary: {
          borderColor: COLORS.primary.borderSubtle,
          color: COLORS.primary.main,
          '&:hover': {
            borderColor: COLORS.primary.main,
            backgroundColor: COLORS.primary.subtleBg,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          background: COLORS.gradients.tabIndicator,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.9rem',
          minHeight: 44,
          padding: '10px 18px',
          color: COLORS.neutral.textSlate,
          fontFamily: FONT_FAMILY.primary,
          '&.Mui-selected': {
            color: COLORS.primary.main,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(24, 113, 247, 0.06)',
            borderColor: COLORS.primary.borderSubtle,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.02)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.neutral.borderLight}`,
          padding: '14px 18px',
        },
        head: {
          backgroundColor: COLORS.neutral.bgHover,
          color: COLORS.neutral.textHeading,
          fontSize: '0.82rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        colorPrimary: {
          backgroundColor: COLORS.primary.subtleBg,
          color: COLORS.primary.main,
          border: `1px solid ${COLORS.primary.borderSubtle}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: COLORS.neutral.bgWhite,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.primary.light,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.primary.main,
            borderWidth: '2px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: COLORS.primary.subtleBg,
            color: COLORS.primary.main,
            '&:hover': {
              backgroundColor: COLORS.primary.subtleHover,
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(24, 113, 247, 0.04)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(24, 113, 247, 0.12)',
        },
        barColorPrimary: {
          background: COLORS.gradients.progressPrimary,
          borderRadius: 4,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)',
          margin: 16,
          maxHeight: 'calc(100% - 32px)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: FONT_FAMILY.heading,
          padding: '24px 28px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '20px 28px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 28px 24px',
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme);
