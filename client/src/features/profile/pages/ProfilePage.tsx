import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SupervisorAccountRoundedIcon from '@mui/icons-material/SupervisorAccountRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CircularProgress from '@mui/material/CircularProgress';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { authApi } from '../../auth/api/authApi';
import { employeesApi } from '../../employees/api/employeesApi';
import { COLORS } from '../../../constants/colors';
import { FONT_FAMILY } from '../../../constants/fonts';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch enriched user details
  const { data: userDetails, isLoading } = useQuery({
    queryKey: ['employee-profile', authUser?.id || authUser?._id],
    queryFn: async () => {
      const targetId = authUser?.id || authUser?._id;
      if (!targetId) return null;
      try {
        const emp = await employeesApi.getEmployeeById(targetId);
        return emp;
      } catch {
        const me = await authApi.getMe();
        return me;
      }
    },
    enabled: !!(authUser?.id || authUser?._id),
  });

  const currentUser = userDetails || authUser;

  // Department and Manager resolution
  const departmentName =
    typeof currentUser?.departmentId === 'object' && currentUser?.departmentId?.name
      ? currentUser.departmentId.name
      : typeof (currentUser as any)?.department === 'string'
      ? (currentUser as any).department
      : 'General Administration';

  const departmentCode =
    typeof currentUser?.departmentId === 'object' && currentUser?.departmentId?.code
      ? currentUser.departmentId.code
      : 'GEN';

  const manager =
    typeof currentUser?.managerId === 'object' && currentUser?.managerId
      ? currentUser.managerId
      : null;

  const handleCopyCode = () => {
    if (!currentUser?.employeeCode) return;
    navigator.clipboard.writeText(currentUser.employeeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Password validation criteria
  const passwordCriteria = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(newPassword) },
    { label: 'One number (0-9)', met: /\d/.test(newPassword) },
    { label: 'One special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const allCriteriaMet = passwordCriteria.every((c) => c.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!allCriteriaMet) {
      setPasswordError('New password does not meet all security criteria.');
      return;
    }
    if (!passwordsMatch) {
      setPasswordError('Confirm password does not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.resetPasswordWithOld({
        email: currentUser?.email || '',
        oldPassword,
        newPassword,
      });

      enqueueSnackbar(res.message || t('profile.password_updated_success'), {
        variant: 'success',
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update password. Please check your current password.';
      setPasswordError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading && !currentUser) {
    return <LoadingSpinner minHeight="450px" message="Loading profile credentials..." />;
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Top Hero Profile Banner ── */}
      <Card
        sx={{
          mb: 3.5,
          borderRadius: '20px',
          overflow: 'hidden',
          border: `1px solid ${COLORS.neutral.borderLight}`,
          boxShadow: '0 8px 30px -6px rgba(15, 23, 42, 0.08)',
          background: COLORS.neutral.bgWhite,
        }}
      >
        {/* Banner Top Strip with Brand Gradient */}
        <Box
          sx={{
            height: { xs: 100, sm: 130 },
            background: COLORS.gradients.heroPanel,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.12,
              backgroundImage:
                'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />
        </Box>

        {/* Banner Content Body */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 4 },
            pb: 3,
            pt: 0,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              justifyContent: 'space-between',
              gap: 2.5,
              mt: { xs: -6, sm: -8 },
              mb: 2,
            }}
          >
            {/* Avatar & Main Info */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, flexWrap: 'wrap' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: { xs: 84, sm: 110 },
                    height: { xs: 84, sm: 110 },
                    border: `4px solid ${COLORS.neutral.bgWhite}`,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
                    bgcolor: COLORS.primary.main,
                    fontSize: { xs: '2rem', sm: '2.6rem' },
                    fontFamily: FONT_FAMILY.heading,
                    fontWeight: 700,
                  }}
                >
                  {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                {/* Active Status Dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: COLORS.feedback.success,
                    border: `2.5px solid ${COLORS.neutral.bgWhite}`,
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                  }}
                />
              </Box>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: FONT_FAMILY.heading,
                      fontWeight: 700,
                      color: COLORS.neutral.textPrimary,
                      letterSpacing: '-0.02em',
                      fontSize: { xs: '1.45rem', sm: '1.85rem' },
                    }}
                  >
                    {currentUser?.fullName || t('navbar.user_fallback')}
                  </Typography>
                  <Tooltip title={t('profile.verified')}>
                    <CheckCircleRoundedIcon sx={{ color: COLORS.primary.main, fontSize: 22 }} />
                  </Tooltip>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: FONT_FAMILY.primary,
                    color: COLORS.neutral.textSlate,
                    fontWeight: 500,
                    mt: 0.25,
                  }}
                >
                  {currentUser?.designation || 'Enterprise Team Member'} · {departmentName}
                </Typography>
              </Box>
            </Box>

            {/* Employee ID Chip & Status */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                mb: 1,
              }}
            >
              {/* Copyable Employee ID */}
              <Box
                onClick={handleCopyCode}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: COLORS.neutral.bgClean,
                  border: `1px solid ${COLORS.neutral.borderLight}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: COLORS.primary.subtleBg,
                    borderColor: COLORS.primary.borderSubtle,
                  },
                }}
              >
                <BadgeOutlinedIcon sx={{ fontSize: 18, color: COLORS.primary.main }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: FONT_FAMILY.primary,
                    fontWeight: 700,
                    color: COLORS.neutral.textPrimary,
                    letterSpacing: '0.04em',
                  }}
                >
                  {currentUser?.employeeCode || 'EMP-0000'}
                </Typography>
                <Tooltip title={copiedCode ? t('profile.copied') : t('profile.copy_id')}>
                  <IconButton size="small" sx={{ p: 0.25, color: COLORS.neutral.textSlate }}>
                    {copiedCode ? (
                      <CheckRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                    ) : (
                      <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Level Badge */}
              <Chip
                label={`Grade ${currentUser?.level || 'L1'}`}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: 'rgba(24, 113, 247, 0.08)',
                  color: COLORS.primary.main,
                  border: `1px solid ${COLORS.primary.borderSubtle}`,
                  borderRadius: 2,
                  py: 1.8,
                  px: 0.5,
                }}
              />

              {/* Status Pill */}
              <Chip
                label={currentUser?.status === 'ACTIVE' ? t('profile.status_active') : t('profile.status_inactive')}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: currentUser?.status === 'ACTIVE' ? COLORS.feedback.successBg : COLORS.feedback.errorBg,
                  color: currentUser?.status === 'ACTIVE' ? COLORS.feedback.success : COLORS.feedback.error,
                  border: `1px solid ${currentUser?.status === 'ACTIVE' ? COLORS.feedback.successBorder : COLORS.feedback.errorBorder}`,
                  borderRadius: 2,
                  py: 1.8,
                  px: 0.5,
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: COLORS.neutral.borderLight }} />

          {/* Quick Metadata Bar */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2, sm: 4 },
              pt: 0.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailOutlinedIcon sx={{ fontSize: 18, color: COLORS.neutral.textSlate }} />
              <Typography variant="body2" sx={{ color: COLORS.neutral.textPrimary, fontWeight: 500 }}>
                {currentUser?.email || 'N/A'}
              </Typography>
            </Box>

            {currentUser?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneOutlinedIcon sx={{ fontSize: 18, color: COLORS.neutral.textSlate }} />
                <Typography variant="body2" sx={{ color: COLORS.neutral.textPrimary, fontWeight: 500 }}>
                  {currentUser.phone}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CorporateFareRoundedIcon sx={{ fontSize: 18, color: COLORS.neutral.textSlate }} />
              <Typography variant="body2" sx={{ color: COLORS.neutral.textPrimary, fontWeight: 500 }}>
                {departmentName} ({departmentCode})
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 18, color: COLORS.neutral.textSlate }} />
              <Typography variant="body2" sx={{ color: COLORS.neutral.textSlate, fontWeight: 500 }}>
                {t('profile.joined_date')}:{' '}
                <strong style={{ color: COLORS.neutral.textPrimary }}>
                  {currentUser?.joinedDate
                    ? new Date(currentUser.joinedDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : currentUser?.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '2024'}
                </strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* ── Tabs Navigation ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              fontFamily: FONT_FAMILY.heading,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              minHeight: 48,
              px: { xs: 2, sm: 3 },
            },
          }}
        >
          <Tab
            icon={<PersonOutlineRoundedIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={t('profile.tab_overview', 'Overview & Details')}
          />
          <Tab
            icon={<LockOutlinedIcon sx={{ fontSize: 19 }} />}
            iconPosition="start"
            label={t('profile.tab_security', 'Security & Password')}
          />
          <Tab
            icon={<LayersOutlinedIcon sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={t('profile.tab_shortcuts', 'Quick Workspace')}
          />
        </Tabs>
      </Box>

      {/* ── Tab 1: Overview & Personal Details ── */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Personal Identity Details Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: COLORS.primary.subtleBg,
                      color: COLORS.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonOutlineRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700, lineHeight: 1.2 }}>
                      {t('profile.personal_info_title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate }}>
                      {t('profile.personal_info_desc')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: COLORS.neutral.borderLight }} />

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.full_name')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.work_email')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.email || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.phone')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.phone || '+1 (555) 019-2834'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.employee_code')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.primary.main, mt: 0.25 }}>
                      {currentUser?.employeeCode || 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Organizational Role & Placement Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: 'rgba(14, 165, 233, 0.1)',
                      color: COLORS.secondary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CorporateFareRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700, lineHeight: 1.2 }}>
                      {t('profile.org_info_title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate }}>
                      {t('profile.org_info_desc')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: COLORS.neutral.borderLight }} />

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.department')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {departmentName} ({departmentCode})
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.designation')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.designation || 'Team Member'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.level')}
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={currentUser?.level || 'L1'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: COLORS.primary.subtleBg,
                          color: COLORS.primary.main,
                          borderRadius: 1.5,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: COLORS.neutral.textSlate }}>
                        {currentUser?.level === 'L7'
                          ? 'Executive / Leadership'
                          : currentUser?.level === 'L6'
                          ? 'Director / Principal'
                          : currentUser?.level === 'L5'
                          ? 'Staff / Senior Lead'
                          : currentUser?.level === 'L4'
                          ? 'Senior Professional'
                          : 'Associate Specialist'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600, mb: 0.75, display: 'block' }}>
                      {t('profile.assigned_roles')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(currentUser?.roles || ['EMPLOYEE']).map((r: string) => (
                        <Chip
                          key={r}
                          label={r}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            bgcolor:
                              r === 'SUPER_ADMIN'
                                ? 'rgba(124, 58, 237, 0.1)'
                                : r === 'HR_ADMIN'
                                ? 'rgba(236, 72, 153, 0.1)'
                                : 'rgba(24, 113, 247, 0.08)',
                            color:
                              r === 'SUPER_ADMIN'
                                ? COLORS.accent.purple
                                : r === 'HR_ADMIN'
                                ? COLORS.accent.pink
                                : COLORS.primary.main,
                            border: `1px solid ${
                              r === 'SUPER_ADMIN'
                                ? 'rgba(124, 58, 237, 0.25)'
                                : r === 'HR_ADMIN'
                                ? 'rgba(236, 72, 153, 0.25)'
                                : COLORS.primary.borderSubtle
                            }`,
                            borderRadius: 1.5,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Reporting Line Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: COLORS.feedback.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SupervisorAccountRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700, lineHeight: 1.2 }}>
                      {t('profile.reporting_title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate }}>
                      {t('profile.reporting_desc')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: COLORS.neutral.borderLight }} />

                {manager ? (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: COLORS.neutral.bgClean,
                      border: `1px solid ${COLORS.neutral.borderLight}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: COLORS.secondary.deepSky,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {manager.firstName?.charAt(0).toUpperCase() || 'M'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.neutral.textPrimary, lineHeight: 1.2 }} noWrap>
                        {manager.firstName} {manager.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.primary.main, fontWeight: 600, display: 'block' }} noWrap>
                        {manager.designation || 'Reporting Manager'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, display: 'block' }} noWrap>
                        {manager.email}
                      </Typography>
                    </Box>
                    {manager.employeeCode && (
                      <Chip
                        label={manager.employeeCode}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          borderRadius: 1.5,
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      bgcolor: COLORS.neutral.bgClean,
                      border: `1px dashed ${COLORS.neutral.borderLight}`,
                      textAlign: 'center',
                    }}
                  >
                    <ShieldOutlinedIcon sx={{ fontSize: 32, color: COLORS.primary.main, mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.neutral.textPrimary }}>
                      {t('profile.no_manager')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, display: 'block', mt: 0.5 }}>
                      This profile reports directly to executive governance.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Employment Timeline Card */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      color: COLORS.feedback.warning,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarTodayRoundedIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700, lineHeight: 1.2 }}>
                      {t('profile.employment_timeline_title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate }}>
                      Account milestones and record dates.
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: COLORS.neutral.borderLight }} />

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.joined_date')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.joinedDate
                        ? new Date(currentUser.joinedDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'September 1, 2024'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      {t('profile.created_at')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: COLORS.neutral.textPrimary, mt: 0.25 }}>
                      {currentUser?.createdAt
                        ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'September 1, 2024'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate, fontWeight: 600 }}>
                      Security Protocol
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.feedback.successDark, fontWeight: 600, mt: 0.25 }}>
                      256-bit SSL Session · Active JWT Authentication
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 2: Security & Password ── */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Change Password Form */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: 'rgba(24, 113, 247, 0.1)',
                      color: COLORS.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LockOutlinedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700 }}>
                      {t('profile.change_password_title')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: COLORS.neutral.textSlate }}>
                      {t('profile.change_password_desc')}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2.5, borderColor: COLORS.neutral.borderLight }} />

                <Box component="form" onSubmit={handleChangePassword} noValidate>
                  <Stack spacing={2.5}>
                    {/* Old Password */}
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.neutral.textHeading, mb: 0.75, display: 'block' }}>
                        {t('profile.old_password')}
                      </Typography>
                      <TextField
                        fullWidth
                        type={showOldPw ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder={t('profile.old_password_placeholder')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon fontSize="small" sx={{ color: COLORS.neutral.textSlate }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowOldPw(!showOldPw)} edge="end">
                                {showOldPw ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* New Password */}
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.neutral.textHeading, mb: 0.75, display: 'block' }}>
                        {t('profile.new_password')}
                      </Typography>
                      <TextField
                        fullWidth
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('profile.new_password_placeholder')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon fontSize="small" sx={{ color: COLORS.neutral.textSlate }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowNewPw(!showNewPw)} edge="end">
                                {showNewPw ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* Real-time Checklist */}
                    {newPassword.length > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: COLORS.neutral.bgClean,
                          border: `1px solid ${COLORS.neutral.borderLight}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.neutral.textPrimary, mb: 1, display: 'block' }}>
                          Password Requirements:
                        </Typography>
                        <Stack spacing={0.75}>
                          {passwordCriteria.map((c, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {c.met ? (
                                <CheckCircleRoundedIcon sx={{ fontSize: 16, color: COLORS.feedback.success }} />
                              ) : (
                                <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16, color: COLORS.neutral.textSlate }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: c.met ? COLORS.feedback.successDark : COLORS.neutral.textSlate,
                                  fontWeight: c.met ? 600 : 400,
                                }}
                              >
                                {c.label}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Confirm Password */}
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.neutral.textHeading, mb: 0.75, display: 'block' }}>
                        {t('profile.confirm_password')}
                      </Typography>
                      <TextField
                        fullWidth
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('profile.confirm_password_placeholder')}
                        error={confirmPassword.length > 0 && !passwordsMatch}
                        helperText={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ''}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockOutlinedIcon fontSize="small" sx={{ color: COLORS.neutral.textSlate }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)} edge="end">
                                {showConfirmPw ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {passwordError && (
                      <Typography variant="caption" sx={{ color: COLORS.feedback.error, fontWeight: 600 }}>
                        {passwordError}
                      </Typography>
                    )}

                    <Box sx={{ pt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={isChangingPassword || !oldPassword || !allCriteriaMet || !passwordsMatch}
                        startIcon={isChangingPassword ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{
                          py: 1.2,
                          px: 3,
                          borderRadius: 2,
                          fontWeight: 600,
                          background: COLORS.gradients.primaryButton,
                        }}
                      >
                        {isChangingPassword ? t('profile.updating_password') : t('profile.update_password_btn')}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Best Practices Card */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: '16px',
                border: `1px solid ${COLORS.neutral.borderLight}`,
                boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
                bgcolor: COLORS.neutral.bgWhite,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      color: COLORS.feedback.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldOutlinedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700 }}>
                    {t('profile.security_tips_title')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: COLORS.neutral.borderLight }} />

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 20, color: COLORS.primary.main, mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: COLORS.neutral.textSecondary, lineHeight: 1.45 }}>
                      {t('profile.security_tip_1')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 20, color: COLORS.primary.main, mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: COLORS.neutral.textSecondary, lineHeight: 1.45 }}>
                      {t('profile.security_tip_2')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 20, color: COLORS.primary.main, mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: COLORS.neutral.textSecondary, lineHeight: 1.45 }}>
                      {t('profile.security_tip_3')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 3: Quick Shortcuts ── */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700 }}>
              {t('profile.quick_shortcuts_title')}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.neutral.textSlate }}>
              Jump straight to your active project boards, review cycles, and timesheets.
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {[
              {
                title: t('profile.shortcut_tasks'),
                desc: t('profile.shortcut_tasks_desc'),
                path: '/tasks',
                icon: <AssignmentOutlinedIcon sx={{ fontSize: 26, color: COLORS.primary.main }} />,
                bg: COLORS.primary.subtleBg,
              },
              {
                title: t('profile.shortcut_timesheet'),
                desc: t('profile.shortcut_timesheet_desc'),
                path: '/tasks/timesheet',
                icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 26, color: COLORS.secondary.main }} />,
                bg: 'rgba(14, 165, 233, 0.1)',
              },
              {
                title: t('profile.shortcut_reviews'),
                desc: t('profile.shortcut_reviews_desc'),
                path: '/reviews',
                icon: <RateReviewOutlinedIcon sx={{ fontSize: 26, color: COLORS.feedback.success }} />,
                bg: 'rgba(16, 185, 129, 0.1)',
              },
              {
                title: t('profile.shortcut_projects'),
                desc: t('profile.shortcut_projects_desc'),
                path: '/projects',
                icon: <FolderOutlinedIcon sx={{ fontSize: 26, color: COLORS.accent.purple }} />,
                bg: 'rgba(124, 58, 237, 0.1)',
              },
            ].map((shortcut, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  onClick={() => navigate(shortcut.path)}
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: '16px',
                    border: `1px solid ${COLORS.neutral.borderLight}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      borderColor: COLORS.primary.borderSubtle,
                      boxShadow: '0 12px 28px -6px rgba(24, 113, 247, 0.12)',
                    },
                  }}
                >
                  <Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        bgcolor: shortcut.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {shortcut.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_FAMILY.heading, fontWeight: 700, mb: 0.5 }}>
                      {shortcut.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.neutral.textSlate, lineHeight: 1.4 }}>
                      {shortcut.desc}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2.5, color: COLORS.primary.main, fontWeight: 600 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Open Workspace
                    </Typography>
                    <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
