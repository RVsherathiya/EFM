import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Stack,
  LinearProgress,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { authApi } from '../api/authApi';
import { Logo } from '../../../components/brand/Logo';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { COLORS } from '../../../constants/colors';
import { useSequentialValidation } from '../../../hooks/useSequentialValidation';

const getResetPasswordFormSchema = (t: TFunction) =>
  z
    .object({
      password: z
        .string()
        .min(8, t('reset_password.err_min_length', 'Password must be at least 8 characters'))
        .regex(/[A-Z]/, t('reset_password.err_uppercase', 'Must contain at least one uppercase letter'))
        .regex(/[a-z]/, t('reset_password.err_lowercase', 'Must contain at least one lowercase letter'))
        .regex(/[0-9]/, t('reset_password.err_number', 'Must contain at least one number'))
        .regex(/[^A-Za-z0-9]/, t('reset_password.err_special', 'Must contain at least one special character')),
      confirmPassword: z.string().min(1, t('reset_password.err_confirm_required', 'Please confirm your password')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('reset_password.err_passwords_mismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    });

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

const RESET_PW_FIELD_ORDER: (keyof ResetPasswordFormData)[] = ['password', 'confirmPassword'];

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams<{ token?: string }>();

  const token = searchParams.get('token') || paramToken || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordFormSchema = useMemo(() => getResetPasswordFormSchema(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const { handleInvalid, getFieldError } = useSequentialValidation(RESET_PW_FIELD_ORDER, errors);

  const currentPassword = watch('password', '');
  const currentConfirmPassword = watch('confirmPassword', '');

  // Calculate live validation criteria
  const hasMinLength = currentPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(currentPassword);
  const hasLowercase = /[a-z]/.test(currentPassword);
  const hasNumber = /[0-9]/.test(currentPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(currentPassword);
  const passwordsMatch = currentPassword.length > 0 && currentPassword === currentConfirmPassword;

  const passedCriteriaCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  const strengthPercentage = (passedCriteriaCount / 5) * 100;

  const getStrengthColor = () => {
    if (passedCriteriaCount <= 2) return COLORS.feedback.error;
    if (passedCriteriaCount <= 4) return COLORS.feedback.warning;
    return COLORS.feedback.success;
  };

  const getStrengthLabel = () => {
    if (passedCriteriaCount <= 1) return t('reset_password.strength_very_weak', 'Very Weak');
    if (passedCriteriaCount === 2) return t('reset_password.strength_weak', 'Weak');
    if (passedCriteriaCount === 3) return t('reset_password.strength_moderate', 'Moderate');
    if (passedCriteriaCount === 4) return t('reset_password.strength_strong', 'Strong');
    return t('reset_password.strength_very_strong', 'Very Strong & Secure');
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidatingToken(false);
        setIsTokenValid(false);
        setErrorMsg(t('reset_password.no_token_error', 'No password reset token was provided in the link. Please request a new link.'));
        return;
      }

      try {
        setIsValidatingToken(true);
        const res = await authApi.verifyResetToken(token);
        if (res.valid) {
          setIsTokenValid(true);
          if (res.email) setUserEmail(res.email);
        } else {
          setIsTokenValid(false);
          setErrorMsg(t('reset_password.token_invalid_error', 'This password reset link is invalid or has expired. Please request a new one.'));
        }
      } catch (err: unknown) {
        setIsTokenValid(false);
        const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
        setErrorMsg(
          errorResponse?.response?.data?.error?.message ||
          t('reset_password.token_invalid_error', 'This password reset link is invalid or has expired. Please request a new one.')
        );
      } finally {
        setIsValidatingToken(false);
      }
    };

    verifyToken();
  }, [token, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setErrorMsg(null);
      await authApi.resetPassword({
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(
        errorResponse?.response?.data?.error?.message ||
        t('reset_password.reset_failed_error', 'Failed to reset password. The link may have expired or is invalid.')
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'stretch',
        bgcolor: COLORS.neutral.darkSurface,
        overflow: 'hidden',
      }}
    >
      <Grid container sx={{ flex: 1, minHeight: '100vh' }}>
        {/* Left Side: Brand Experience */}
        {!isMobile && (
          <Grid
            item
            md={6}
            lg={6.5}
            sx={{
              position: 'relative',
              background: COLORS.gradients.heroPanel,
              p: { md: 6, lg: 8 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              color: COLORS.neutral.textWhite,
            }}
          >
            {/* Subtle Tech Grid Pattern Overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />

            {/* Ambient Background Light & Glow Orbs */}
            <Box
              sx={{
                position: 'absolute',
                top: '-12%',
                left: '-8%',
                width: 550,
                height: 550,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, rgba(56, 189, 248, 0.25) 40%, rgba(24, 113, 247, 0) 70%)',
                filter: 'blur(45px)',
                pointerEvents: 'none',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '-15%',
                right: '-8%',
                width: 580,
                height: 580,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />

            {/* Top Brand Header */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Logo size="lg" themeMode="dark" portalName={t('brand.suite', 'Enterprise Workforce & Appraisal Suite')} />
            </Box>

            {/* Center Information */}
            <Box sx={{ position: 'relative', zIndex: 2, my: 'auto', py: 2 }}>
              <Typography
                variant="h3"
                sx={{
                  lineHeight: 1.15,
                  mb: 2.25,
                  letterSpacing: '-0.03em',
                  color: COLORS.neutral.textWhite,
                  textShadow: '0 2px 14px rgba(0, 0, 0, 0.15)',
                }}
              >
                {t('reset_password.hero_headline', 'Secure Workspace Authentication.')}
              </Typography>

              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.92)', mb: 4, maxWidth: 540, lineHeight: 1.65 }}>
                {t('reset_password.hero_subtext', 'Set a strong, unique password to safeguard your administrative workspace, confidential review records, and employee timesheet data.')}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Right Side: Reset Form */}
        <Grid
          item
          xs={12}
          md={6}
          lg={5.5}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: COLORS.neutral.bgWhite,
            p: { xs: 2.5, sm: 4, md: 5, lg: 6 },
            minHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 460, my: 'auto' }}>
            {/* Loading State */}
            {isValidatingToken && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <LoadingSpinner
                  message={t('reset_password.validating_title', 'Validating Reset Link...')}
                  minHeight="280px"
                />
              </Box>
            )}

            {/* Invalid / Expired Token State */}
            {!isValidatingToken && !isTokenValid && !isSuccess && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'error.50',
                    color: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px auto',
                    border: `1px solid ${COLORS.primary.borderSubtle}`,
                  }}
                >
                  <ErrorOutlineRoundedIcon sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" color="text.primary" gutterBottom>
                  {t('reset_password.invalid_title', 'Link Invalid or Expired')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                  {errorMsg || t('reset_password.invalid_subtext_default', 'For security purposes, password reset links expire after 30 minutes or can only be used once.')}
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.4,
                    borderRadius: 2.5,
                    background: COLORS.gradients.primaryButton,
                    textTransform: 'none',
                  }}
                >
                  {t('reset_password.return_to_signin', 'Return to Sign In & Request New Link')}
                </Button>
              </Box>
            )}

            {/* Success State */}
            {isSuccess && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'success.50',
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px auto',
                    border: `2px solid ${COLORS.feedback.success}`,
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <CheckCircleRoundedIcon sx={{ fontSize: 44 }} />
                </Box>
                <Typography variant="h4" color="text.primary" gutterBottom>
                  {t('reset_password.success_title', 'Password Reset Successful!')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                  {t('reset_password.success_message', 'Your password has been updated securely. You can now access your Excellent Web World account using your new credentials.')}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/login', { replace: true })}
                  sx={{
                    py: 1.5,
                    borderRadius: 2.5,
                    background: COLORS.gradients.primaryButton,
                    boxShadow: '0 8px 20px -4px rgba(24, 113, 247, 0.4)',
                    textTransform: 'none',
                  }}
                >
                  {t('reset_password.sign_in_cta', 'Sign In to Workspace')}
                </Button>
              </Box>
            )}

            {/* Active Reset Password Form */}
            {!isValidatingToken && isTokenValid && !isSuccess && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" component="h1" color="text.primary" letterSpacing="-0.02em" gutterBottom>
                    {t('reset_password.form_title', 'Set New Password')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userEmail
                      ? t('reset_password.form_subtitle_email', { email: userEmail, defaultValue: `Resetting password for verified account: ${userEmail}` })
                      : t('reset_password.form_subtitle_default', 'Please create a strong new password for your enterprise account.')}
                  </Typography>
                </Box>

                {errorMsg && (
                  <Fade in={Boolean(errorMsg)}>
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
                      {errorMsg}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit, handleInvalid)} noValidate>
                  {/* New Password */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'block' }}>
                      {t('reset_password.new_password_label', 'New Password')}
                    </Typography>
                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      {...register('password')}
                      error={!!getFieldError('password')}
                      helperText={getFieldError('password')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t('reset_password.toggle_password_visibility', 'Toggle password visibility')}
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOutlinedIcon fontSize="small" />
                              ) : (
                                <VisibilityOffOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                          bgcolor: COLORS.neutral.bgWhite,
                          '& fieldset': {
                            borderColor: COLORS.neutral.border,
                            borderWidth: '1.5px',
                          },
                          '&:hover fieldset': {
                            borderColor: COLORS.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: COLORS.primary.main,
                            borderWidth: '2px',
                          },
                          '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                            WebkitBoxShadow: `0 0 0 1000px ${COLORS.neutral.bgWhite} inset !important`,
                            WebkitTextFillColor: `${COLORS.neutral.textPrimary} !important`,
                            transition: 'background-color 5000s ease-in-out 0s',
                            boxShadow: 'none !important',
                          },
                        },
                      }}
                    />

                    {/* Password Strength Meter */}
                    {currentPassword.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {t('reset_password.strength_label', 'Password Strength:')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: getStrengthColor() }}>
                            {getStrengthLabel()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={strengthPercentage}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: COLORS.neutral.borderLight,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getStrengthColor(),
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  {/* Confirm New Password */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'block' }}>
                      {t('reset_password.confirm_password_label', 'Confirm New Password')}
                    </Typography>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      error={!!getFieldError('confirmPassword')}
                      helperText={getFieldError('confirmPassword')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t('reset_password.toggle_confirm_visibility', 'Toggle confirm password visibility')}
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              size="small"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOutlinedIcon fontSize="small" />
                              ) : (
                                <VisibilityOffOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2.5,
                          bgcolor: COLORS.neutral.bgWhite,
                          '& fieldset': {
                            borderColor: COLORS.neutral.border,
                            borderWidth: '1.5px',
                          },
                          '&:hover fieldset': {
                            borderColor: COLORS.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: COLORS.primary.main,
                            borderWidth: '2px',
                          },
                          '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                            WebkitBoxShadow: `0 0 0 1000px ${COLORS.neutral.bgWhite} inset !important`,
                            WebkitTextFillColor: `${COLORS.neutral.textPrimary} !important`,
                            transition: 'background-color 5000s ease-in-out 0s',
                            boxShadow: 'none !important',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Password Rules Checklist Card */}
                  <Card
                    sx={{
                      mb: 3.5,
                      borderRadius: 2.5,
                      bgcolor: COLORS.neutral.bgHover,
                      border: `1px solid ${COLORS.neutral.borderLight}`,
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em" sx={{ mb: 1.5, display: 'block' }}>
                        {t('reset_password.requirements_heading', 'Password Requirements')}
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {hasMinLength ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                          ) : (
                            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.neutral.textMuted }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: hasMinLength ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {t('reset_password.req_min_length', 'At least 8 characters in length')}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {hasUppercase && hasLowercase ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                          ) : (
                            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.neutral.textMuted }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: hasUppercase && hasLowercase ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {t('reset_password.req_casing', 'Both uppercase (A-Z) & lowercase (a-z) letters')}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {hasNumber ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                          ) : (
                            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.neutral.textMuted }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: hasNumber ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {t('reset_password.req_number', 'At least one number (0-9)')}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {hasSpecial ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                          ) : (
                            <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.neutral.textMuted }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: hasSpecial ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {t('reset_password.req_special', 'At least one special character (!@#$%^&*)')}
                          </Typography>
                        </Box>

                        {currentConfirmPassword.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {passwordsMatch ? (
                              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                            ) : (
                              <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.error }} />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                color: passwordsMatch ? COLORS.feedback.success : COLORS.feedback.error,
                              }}
                            >
                              {passwordsMatch ? t('reset_password.passwords_match', 'Passwords match') : t('reset_password.passwords_not_match', 'Passwords do not match yet')}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting || passedCriteriaCount < 5 || !passwordsMatch}
                    sx={{
                      py: 1.4,
                      fontSize: '1rem',
                      borderRadius: 2.5,
                      background: COLORS.gradients.primaryButton,
                      boxShadow: '0 8px 20px -4px rgba(24, 113, 247, 0.4)',
                      textTransform: 'none',
                      '&:hover': {
                        background: COLORS.gradients.primaryButtonActive,
                        boxShadow: '0 10px 24px -4px rgba(24, 113, 247, 0.5)',
                      },
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        {t('reset_password.submitting', 'Updating...')}
                      </>
                    ) : (
                      t('reset_password.submit', 'Update & Save New Password')
                    )}
                  </Button>

                  {/* Bottom Back Link */}
                  <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                    <Button
                      component={Link}
                      to="/login"
                      startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                        fontSize: '0.875rem',
                      }}
                    >
                      {t('reset_password.back_to_sign_in', 'Back to Sign In')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Fullscreen Blur Loader on form submit */}
      {isSubmitting && (
        <LoadingSpinner
          fullScreen
          message={t('reset_password.resetting', 'Updating password...')}
        />
      )}
    </Box>
  );
};
