/**
 * LoginPage — Enterprise Authentication Screen
 * Excellent Web World · Workforce & Appraisal Suite
 *
 * Features:
 *  - Two-panel CSS Grid layout (hero left, form right) — collapses on mobile
 *  - All UI strings via react-i18next (en.json) — i18n-ready, RTL-compatible
 *  - Animated floating input labels (idle → active on focus / value)
 *  - WCAG AA contrast throughout
 *  - 44px+ touch targets on all interactive elements
 *  - Smooth 200–300ms transitions on all state changes
 *  - Super-admin credentials pre-filled (dev convenience)
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Box,
  CircularProgress,
  Fade,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Logo } from '../../../components/brand/Logo';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { SUPER_ADMIN_CREDENTIALS } from '../../../constants';
import { useSequentialValidation } from '../../../hooks/useSequentialValidation';
import '../styles/LoginPage.css';

/* ─── Capitalize helper ─── */
const capitalizeFirst = (text?: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/* ─── Validation schemas ─── */
const getLoginSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .min(1, t('login.error_email_required', 'Email is required'))
      .email(t('login.error_invalid_email', 'Please enter a valid email address'))
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(1, t('login.error_password_required', 'Password is required')),
  });

const getForgotSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .min(1, t('forgot_password.error_email_required', 'Email is required'))
      .email(t('forgot_password.error_invalid_email', 'Please enter a valid email address'))
      .trim()
      .toLowerCase(),
  });

const getChangePasswordSchema = (t: TFunction) =>
  z
    .object({
      oldPassword: z
        .string()
        .min(1, t('change_password.error_old_required', 'Old password is required')),
      newPassword: z
        .string()
        .min(8, t('change_password.error_min_length', 'Password must be at least 8 characters')),
      confirmPassword: z
        .string()
        .min(1, t('change_password.error_confirm_required', 'Please confirm your password')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('change_password.error_passwords_mismatch', 'Passwords do not match'),
      path: ['confirmPassword'],
    });

type LoginForm = { email: string; password: string };
type ForgotForm = { email: string };
type ChangePasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const LOGIN_FIELD_ORDER: (keyof LoginForm)[] = ['email', 'password'];
const FORGOT_FIELD_ORDER: (keyof ForgotForm)[] = ['email'];
const CHANGE_PW_FIELD_ORDER: (keyof ChangePasswordForm)[] = ['oldPassword', 'newPassword', 'confirmPassword'];

/* ─── Feature card data ─── */
const FEATURES = [
  {
    icon: <AssessmentOutlinedIcon fontSize="small" />,
    titleKey: 'hero.feature1_title',
    descKey: 'hero.feature1_desc',
  },
  {
    icon: <VerifiedUserOutlinedIcon fontSize="small" />,
    titleKey: 'hero.feature2_title',
    descKey: 'hero.feature2_desc',
  },
  {
    icon: <BarChartRoundedIcon fontSize="small" />,
    titleKey: 'hero.feature3_title',
    descKey: 'hero.feature3_desc',
  },
] as const;


/* ══════════════════════════════════════════════════════════
   FLOATING INPUT — reusable component
══════════════════════════════════════════════════════════ */
interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  icon: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    {
      id,
      name,
      type = 'text',
      label,
      value,
      defaultValue,
      error,
      icon,
      endAdornment,
      autoComplete,
      onChange,
      onBlur,
      onFocus,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [currentVal, setCurrentVal] = useState<string>(
      String(value ?? defaultValue ?? '')
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setCurrentVal(String(value));
      }
    }, [value]);

    const hasValue = Boolean(
      currentVal ||
      (value !== undefined && value !== '') ||
      (defaultValue !== undefined && defaultValue !== '')
    );
    const isActive = focused || hasValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentVal(e.target.value);
      onChange?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`lp-field ${error ? 'error' : ''}`}>
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`lp-label ${isActive ? 'active' : 'idle'} ${focused ? 'focused' : ''} ${error ? 'error' : ''}`}
        >
          {label}
        </label>

        {/* Input wrapper */}
        <div className={`lp-input-wrap ${focused ? 'focused' : ''} ${error ? 'error' : ''}`}>
          <span className="lp-input-icon">{icon}</span>

          <input
            ref={ref}
            id={id}
            name={name}
            type={type}
            className="lp-input"
            autoComplete={autoComplete}
            value={value !== undefined ? value : undefined}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            {...rest}
          />

          {endAdornment}
        </div>

        {/* Error message */}
        {error && (
          <p id={`${id}-error`} className="lp-error-msg" role="alert">
            <ErrorOutlineRoundedIcon sx={{ fontSize: 13 }} />
            <span>{capitalizeFirst(error)}</span>
          </p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = 'FloatingInput';

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── State ── */
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'change_password'>('login');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);

  // Track transitions only when authMode actually changes — prevents blinking on initial load / hard refresh
  const prevAuthMode = React.useRef(authMode);
  const isTransitioning = prevAuthMode.current !== authMode;

  React.useEffect(() => {
    prevAuthMode.current = authMode;
  }, [authMode]);

  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
  const successMsg = (location.state as { passwordResetSuccess?: string })?.passwordResetSuccess;

  /* ── Schemas ── */
  const loginSchema = React.useMemo(() => getLoginSchema(t), [t]);
  const forgotSchema = React.useMemo(() => getForgotSchema(t), [t]);
  const changePasswordSchema = React.useMemo(() => getChangePasswordSchema(t), [t]);

  /* ── Login form ── */
  const {
    register,
    handleSubmit,
    watch,
    reset: resetLogin,
    formState: { errors: loginErrors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: SUPER_ADMIN_CREDENTIALS.email,
      password: SUPER_ADMIN_CREDENTIALS.password,
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    handleInvalid: handleLoginInvalid,
    getFieldError: getLoginFieldError,
    resetValidation: resetLoginValidation,
  } = useSequentialValidation(LOGIN_FIELD_ORDER, loginErrors);

  const emailVal = watch('email', SUPER_ADMIN_CREDENTIALS.email);
  const passwordVal = watch('password', SUPER_ADMIN_CREDENTIALS.password);

  /* ── Forgot password form ── */
  const {
    register: regForgot,
    handleSubmit: submitForgot,
    reset: resetForgot,
    watch: watchForgot,
    formState: { errors: forgotErrors, isSubmitting: isForgotSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    handleInvalid: handleForgotInvalid,
    getFieldError: getForgotFieldError,
    resetValidation: resetForgotValidation,
  } = useSequentialValidation(FORGOT_FIELD_ORDER, forgotErrors);

  const forgotEmailVal = watchForgot('email', '');

  /* ── Change password form ── */
  const {
    register: regChange,
    handleSubmit: submitChange,
    reset: resetChange,
    watch: watchChange,
    formState: { errors: changeErrors, isSubmitting: isChangeSubmitting },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const {
    handleInvalid: handleChangeInvalid,
    getFieldError: getChangeFieldError,
    resetValidation: resetChangeValidation,
  } = useSequentialValidation(CHANGE_PW_FIELD_ORDER, changeErrors);

  const oldPasswordVal = watchChange('oldPassword', '');
  const newPasswordVal = watchChange('newPassword', '');
  const confirmPasswordVal = watchChange('confirmPassword', '');

  /* ── Handlers ── */
  const onLogin = async (data: LoginForm) => {
    setErrorMsg(null);
    try {
      const res = await login(data);
      const successMsg = res?.message || t('login.success_message', 'Signed in successfully.');
      enqueueSnackbar(successMsg, { variant: 'success' });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = e?.response?.data?.error?.message || e?.message || t('login.error_login_failed');
      setErrorMsg(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const openForgot = () => {
    setErrorMsg(null);
    resetForgot();
    resetForgotValidation();
    setAuthMode('forgot');
  };

  const backToLogin = () => {
    setErrorMsg(null);
    resetLoginValidation();
    setAuthMode('login');
  };

  const onForgotSubmit = async (data: ForgotForm) => {
    try {
      const res = await authApi.forgotPassword(data.email);
      // Success toast: show only backend api side message
      enqueueSnackbar(res.message, { variant: 'success' });
      setVerifiedEmail(data.email);
      setResetToken(res.token);
      resetChange();
      resetChangeValidation();
      setAuthMode('change_password');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = e?.response?.data?.error?.message || t('forgot_password.error_default');
      // Error toast: show backend error message at top-right
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const onChangePasswordSubmit = async (data: ChangePasswordForm) => {
    try {
      const res = await authApi.resetPasswordWithOld({
        email: verifiedEmail,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        token: resetToken,
      });
      // Success toast: show only backend api side message
      enqueueSnackbar(res.message, { variant: 'success' });
      // Update login form to pre-populate verified email and clear password
      resetLogin({
        email: verifiedEmail,
        password: '',
      });
      resetLoginValidation();
      resetChange();
      resetChangeValidation();
      setAuthMode('login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = e?.response?.data?.error?.message || 'Failed to update password. Please check your credentials.';
      // Error toast: show backend error message at top-right
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  /* ── Password toggle buttons ── */
  const PasswordToggle = (
    <button
      type="button"
      className="lp-pw-toggle"
      onClick={() => setShowPassword(p => !p)}
      aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
    >
      {showPassword
        ? <VisibilityOutlinedIcon fontSize="small" />
        : <VisibilityOffOutlinedIcon fontSize="small" />}
    </button>
  );

  const OldPasswordToggle = (
    <button
      type="button"
      className="lp-pw-toggle"
      onClick={() => setShowOldPassword(p => !p)}
      aria-label={showOldPassword ? 'Hide password' : 'Show password'}
    >
      {showOldPassword
        ? <VisibilityOutlinedIcon fontSize="small" />
        : <VisibilityOffOutlinedIcon fontSize="small" />}
    </button>
  );

  const NewPasswordToggle = (
    <button
      type="button"
      className="lp-pw-toggle"
      onClick={() => setShowNewPassword(p => !p)}
      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
    >
      {showNewPassword
        ? <VisibilityOutlinedIcon fontSize="small" />
        : <VisibilityOffOutlinedIcon fontSize="small" />}
    </button>
  );

  const ConfirmPasswordToggle = (
    <button
      type="button"
      className="lp-pw-toggle"
      onClick={() => setShowConfirmPassword(p => !p)}
      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
    >
      {showConfirmPassword
        ? <VisibilityOutlinedIcon fontSize="small" />
        : <VisibilityOffOutlinedIcon fontSize="small" />}
    </button>
  );

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="lp-root">
      <div className="lp-grid">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO PANEL (left on desktop,
            compact strip on mobile)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="lp-hero" aria-label="Product information">
          {/* Background layers */}
          <div className="lp-hero-dots" aria-hidden="true" />
          <div className="lp-orb-tl" aria-hidden="true" />
          <div className="lp-orb-br" aria-hidden="true" />

          {/* ── Full hero content — visible at every breakpoint ── */}
          <header className="lp-hero-header">
            <Logo size="lg" themeMode="dark" portalName={t('brand.suite')} />
          </header>

          <div className="lp-hero-body">
            <h2 className="lp-hero-title">{t('hero.headline')}</h2>
            <p className="lp-hero-sub">{t('hero.subtext')}</p>

            <div className="lp-features">
              {FEATURES.map((f) => (
                <div key={f.titleKey} className="lp-card">
                  <div className="lp-card-icon">{f.icon}</div>
                  <div>
                    <p className="lp-card-title">{t(f.titleKey)}</p>
                    <p className="lp-card-desc">{t(f.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FORM PANEL (right on desktop,
            below hero strip on mobile)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <main
          className="lp-form-panel"
          aria-label={
            authMode === 'login'
              ? 'Sign in'
              : authMode === 'forgot'
              ? 'Reset workspace password'
              : 'Change password'
          }
        >
          {authMode === 'login' && (
            <div className={`lp-form-inner ${isTransitioning ? 'lp-view-enter' : ''}`} key="login">
              {/* Greeting */}
              <Box sx={{ mb: 3.5 }}>
                <h1 className="lp-form-title">{t('login.welcome')}</h1>
                <p className="lp-form-sub">{t('login.subtitle')}</p>
              </Box>

              {/* Success banner */}
              {successMsg && (
                <div className="lp-alert lp-alert-success" role="status">
                  {successMsg}
                </div>
              )}

              {/* Error banner */}
              {errorMsg && (
                <Fade in={!!errorMsg}>
                  <div className="lp-alert lp-alert-error" role="alert">
                    <ErrorOutlineRoundedIcon sx={{ fontSize: 18, flexShrink: 0, mt: '1px' }} />
                    {errorMsg}
                  </div>
                </Fade>
              )}

              {/* ── Login form ── */}
              <form onSubmit={handleSubmit(onLogin, handleLoginInvalid)} noValidate>
                {/* Email */}
                <FloatingInput
                  id="login-email"
                  type="email"
                  label={t('login.email_label')}
                  error={getLoginFieldError('email')}
                  icon={<EmailOutlinedIcon fontSize="small" />}
                  autoComplete="email"
                  {...register('email')}
                  value={emailVal}
                />

                {/* Password */}
                <FloatingInput
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('login.password_label')}
                  error={getLoginFieldError('password')}
                  icon={<LockOutlinedIcon fontSize="small" />}
                  endAdornment={PasswordToggle}
                  autoComplete="current-password"
                  {...register('password')}
                  value={passwordVal}
                />

                {/* Remember me + Forgot password */}
                <div className="lp-options-row">
                  <label className="lp-remember" htmlFor="login-remember">
                    <input
                      id="login-remember"
                      type="checkbox"
                      className="lp-remember-check"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="lp-remember-label">{t('login.remember_me')}</span>
                  </label>

                  <button
                    type="button"
                    className="lp-forgot-btn"
                    onClick={openForgot}
                  >
                    {t('login.forgot_password')}
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="lp-submit-btn"
                  disabled={isSubmitting}
                  id="login-submit-btn"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={18} color="inherit" />
                      {t('login.signing_in')}
                    </>
                  ) : (
                    t('login.sign_in')
                  )}
                </button>
              </form>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className={`lp-form-inner ${isTransitioning ? 'lp-view-enter' : ''}`} key="forgot">
              {/* Greeting */}
              <Box sx={{ mb: 3.5 }}>
                <h1 className="lp-form-title">{t('forgot_password.title', 'Reset Password')}</h1>
                <p className="lp-form-sub">{t('forgot_password.instructions', "Enter your authorized email and we'll send a reset link.")}</p>
              </Box>

              {/* ── Reset form ── */}
              <div>
                <form onSubmit={submitForgot(onForgotSubmit, handleForgotInvalid)} noValidate>
                  {/* Email */}
                  <FloatingInput
                    id="forgot-email"
                    type="email"
                    label={t('forgot_password.email_label', 'Email')}
                    error={getForgotFieldError('email')}
                    icon={<EmailOutlinedIcon fontSize="small" />}
                    autoComplete="email"
                    {...regForgot('email')}
                    value={forgotEmailVal}
                  />

                  {/* Send Reset Link CTA */}
                  <button
                    type="submit"
                    className="lp-submit-btn"
                    disabled={isForgotSubmitting}
                    id="forgot-submit-btn"
                  >
                    {isForgotSubmitting ? (
                      <>
                        <CircularProgress size={18} color="inherit" />
                        {t('forgot_password.submitting', 'Sending…')}
                      </>
                    ) : (
                      t('forgot_password.submit', 'Send Reset Link')
                    )}
                  </button>

                  {/* Bottom Back Link */}
                  <div style={{ textAlign: 'center', marginTop: 18 }}>
                    <button
                      type="button"
                      className="lp-forgot-btn"
                      style={{ display: 'inline-flex', margin: '0 auto' }}
                      onClick={backToLogin}
                    >
                      <ArrowBackRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      {t('forgot_password.back_to_sign_in', 'Back to Sign In')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {authMode === 'change_password' && (
            <div className={`lp-form-inner ${isTransitioning ? 'lp-view-enter' : ''}`} key="change_password">
              {/* Greeting */}
              <Box sx={{ mb: 3.5 }}>
                <h1 className="lp-form-title">{t('change_password.title', 'Change Password')}</h1>
                <p className="lp-form-sub">
                  {verifiedEmail
                    ? `Update password for ${verifiedEmail}`
                    : t('change_password.subtitle', 'Enter your old password and choose a secure new password.')}
                </p>
              </Box>

              {/* ── Change Password Form ── */}
              <div>
                <form onSubmit={submitChange(onChangePasswordSubmit, handleChangeInvalid)} noValidate>
                  {/* Old Password */}
                  <FloatingInput
                    id="change-old-password"
                    type={showOldPassword ? 'text' : 'password'}
                    label={t('change_password.old_password_label', 'Old Password')}
                    error={getChangeFieldError('oldPassword')}
                    icon={<LockOutlinedIcon fontSize="small" />}
                    endAdornment={OldPasswordToggle}
                    autoComplete="current-password"
                    {...regChange('oldPassword')}
                    value={oldPasswordVal}
                  />

                  {/* New Password */}
                  <FloatingInput
                    id="change-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    label={t('change_password.new_password_label', 'New Password')}
                    error={getChangeFieldError('newPassword')}
                    icon={<LockOutlinedIcon fontSize="small" />}
                    endAdornment={NewPasswordToggle}
                    autoComplete="new-password"
                    {...regChange('newPassword')}
                    value={newPasswordVal}
                  />

                  {/* Confirm Password */}
                  <FloatingInput
                    id="change-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    label={t('change_password.confirm_password_label', 'Confirm Password')}
                    error={getChangeFieldError('confirmPassword')}
                    icon={<LockOutlinedIcon fontSize="small" />}
                    endAdornment={ConfirmPasswordToggle}
                    autoComplete="new-password"
                    {...regChange('confirmPassword')}
                    value={confirmPasswordVal}
                  />

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    className="lp-submit-btn"
                    disabled={isChangeSubmitting}
                    id="change-password-submit-btn"
                  >
                    {isChangeSubmitting ? (
                      <>
                        <CircularProgress size={18} color="inherit" />
                        {t('change_password.submitting', 'Updating…')}
                      </>
                    ) : (
                      t('change_password.submit', 'Update Password')
                    )}
                  </button>

                  {/* Bottom Back Link */}
                  <div style={{ textAlign: 'center', marginTop: 18 }}>
                    <button
                      type="button"
                      className="lp-forgot-btn"
                      style={{ display: 'inline-flex', margin: '0 auto' }}
                      onClick={backToLogin}
                    >
                      <ArrowBackRoundedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      {t('change_password.back_to_login', 'Back to Sign In')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Custom Animated Fullscreen Blur Loader on form submit */}
      {isSubmitting && (
        <LoadingSpinner fullScreen message={t('login.signing_in', 'Signing in...')} />
      )}
      {isForgotSubmitting && (
        <LoadingSpinner fullScreen message={t('forgot_password.verifying', 'Verifying email...')} />
      )}
      {isChangeSubmitting && (
        <LoadingSpinner fullScreen message={t('change_password.submitting', 'Updating password...')} />
      )}
    </div>
  );
};
