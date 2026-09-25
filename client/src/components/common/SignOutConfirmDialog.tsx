import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Fade,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import { FONT_FAMILY } from '../../constants/fonts';
import { useAuth } from '../../features/auth/context/AuthContext';

export interface SignOutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  user?: {
    fullName?: string;
    email?: string;
    roles?: string[];
    employeeCode?: string;
  } | null;
  onLogout?: () => Promise<{ message?: string } | void> | void;
}

export const SignOutConfirmDialog: React.FC<SignOutConfirmDialogProps> = ({
  open,
  onClose,
  onLogout: propOnLogout,
}) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      let res: { message?: string } | void;
      if (propOnLogout) {
        res = await propOnLogout();
      } else {
        res = await logout();
      }

      const successMsg =
        (res && typeof res === 'object' && res.message) ||
        t('sign_out_dialog.success_message', 'Signed out successfully.');

      enqueueSnackbar(successMsg, {
        variant: 'success',
      });

      onClose();
      navigate('/login', { replace: true });
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        t('sign_out_dialog.error_message', 'Failed to sign out. Please try again.');

      enqueueSnackbar(errMsg, {
        variant: 'error',
      });
      setIsSigningOut(false);
    }
  };

  const handleClose = () => {
    if (!isSigningOut) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Fade}
      transitionDuration={250}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
          },
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.28)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          p: { xs: 1.5, sm: 2 },
          position: 'relative',
        },
      }}
    >
      {/* Top Close Button */}
      <IconButton
        onClick={handleClose}
        disabled={isSigningOut}
        aria-label={t('common.cancel', 'Cancel')}
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          color: COLORS.neutral.textSlate,
          '&:hover': {
            backgroundColor: COLORS.neutral.bgMuted,
            color: COLORS.neutral.textPrimary,
          },
        }}
        size="small"
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ textAlign: 'center', pt: 3.5, pb: 1.5, px: { xs: 2, sm: 3 } }}>
        {/* Sign Out Warning Icon Badge */}
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            bgcolor: 'rgba(239, 68, 68, 0.09)',
            border: '1.5px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.feedback.error,
            mx: 'auto',
            mb: 2,
            boxShadow: '0 8px 20px -4px rgba(239, 68, 68, 0.25)',
          }}
        >
          <LogoutRoundedIcon sx={{ fontSize: 30 }} />
        </Box>

        {/* Modal Title & Question */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: FONT_FAMILY.heading,
            fontWeight: 700,
            color: COLORS.neutral.textPrimary,
            letterSpacing: '-0.015em',
            mb: 0.5,
          }}
        >
          {t('sign_out_dialog.title', 'Sign Out')}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontFamily: FONT_FAMILY.primary,
            color: COLORS.neutral.textSecondary,
            mb: 2.5,
          }}
        >
          {t('sign_out_dialog.confirm_question', 'Are you sure you want to sign out?')}
        </Typography>

      </DialogContent>

      {/* Action Buttons */}
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2.5, pt: 1, gap: 1.5 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={isSigningOut}
          fullWidth
          id="sign-out-cancel-btn"
          sx={{
            py: 1.1,
            borderRadius: 2.5,
            borderColor: COLORS.neutral.border,
            color: COLORS.neutral.textSecondary,
            fontFamily: FONT_FAMILY.primary,
            textTransform: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            '&:hover': {
              borderColor: COLORS.neutral.textSlate,
              backgroundColor: COLORS.neutral.bgHover,
            },
          }}
        >
          {t('sign_out_dialog.cancel', 'Cancel')}
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirmSignOut}
          disabled={isSigningOut}
          fullWidth
          id="sign-out-confirm-btn"
          startIcon={
            isSigningOut ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <LogoutRoundedIcon sx={{ fontSize: 20 }} />
            )
          }
          sx={{
            py: 1.1,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: COLORS.neutral.textWhite,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            fontFamily: FONT_FAMILY.primary,
            textTransform: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45)',
            },
            '&.Mui-disabled': {
              background: 'rgba(239, 68, 68, 0.6)',
              color: 'rgba(255, 255, 255, 0.8)',
            },
          }}
        >
          {isSigningOut
            ? t('sign_out_dialog.signing_out', 'Signing out…')
            : t('sign_out_dialog.confirm', 'Sign Out')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
