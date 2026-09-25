/**
 * Localized Text Strings & App Constants
 * Excellent Web World - Enterprise Workforce & Appraisal Suite
 */

export const AUTH_STRINGS = {
  portal: {
    brandName: 'Excellent Web World',
    portalSubtitle: 'Enterprise Workforce & Appraisal Suite',
    metaTitle: 'Excellent Web World - Enterprise Workforce & Appraisal Suite',
  },
  login: {
    heading: 'Welcome back',
    subheading: 'Enter your authorized credentials to access your administrative workspace.',
    emailLabel: 'Email',
    emailPlaceholder: 'Email',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••••••',
    forgotPasswordLink: 'Forgot password?',
    rememberMe: 'Remember this browser for 30 days',
    submitButton: 'Sign In to Workspace',
    submittingButton: 'Signing In...',
    errors: {
      invalidEmail: 'Please enter a valid email',
      passwordRequired: 'Password is required',
      defaultLoginFailed: 'Invalid credentials. Please verify your email and password.',
    },
  },
  forgotPassword: {
    dialogTitle: 'Reset Workspace Password',
    instructions: "Enter your authorized email and we'll send you an active link to configure a new password.",
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@efm.portal',
    submitButton: 'Send Reset Link',
    submittingButton: 'Dispatching...',
    cancelButton: 'Cancel',
    successTitle: 'Check Your Email',
    successHeading: 'Reset Instructions Dispatched',
    successMessage: (email: string) =>
      `If an active account exists for ${email}, a secure password reset link has been dispatched. The link is active for 30 minutes.`,
    devShortcutHeading: '⚡ Instant Access (Development Link):',
    devShortcutButton: 'Open Password Reset Screen',
    errors: {
      defaultFailed: 'Failed to dispatch reset instructions. Please try again.',
    },
  },
  showcase: {
    heroTitle: 'Seamless Appraisal Cycles & Effort Tracking.',
    heroSubtitle:
      'Automate multi-tier reviews, calibrated grade distributions, timesheet approvals, and real-time audit logging from a centralized executive portal.',
    feature1Title: 'Automated 360° Appraisal Engine',
    feature1Desc: 'Self, Senior, and PM scoring with L1–L7 weighted criteria rules.',
    feature2Title: 'Audit-Ready Compliance & Period Locks',
    feature2Desc: 'Strict immutable audit logs and automated timesheet cutoff locking.',
  },
} as const;

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@efm.portal',
  password: 'Password@123',
} as const;
