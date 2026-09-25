import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Box,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LockClockOutlinedIcon from '@mui/icons-material/LockClockOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../brand/Logo';
import { COLORS } from '../../constants/colors';

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  userRoles?: string[];
}

const DRAWER_WIDTH = 260;

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle, userRoles = ['EMPLOYEE'] }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const isSenior = userRoles.includes('SENIOR') || userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');
  const isPM = userRoles.includes('PM') || userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');
  const isHR = userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  const navItems = [
    {
      group: t('nav.general'),
      items: [
        { label: t('nav.dashboard'), path: '/dashboard', icon: <DashboardOutlinedIcon /> },
        { label: t('nav.my_tasks'), path: '/tasks', icon: <AssignmentOutlinedIcon /> },
        { label: t('nav.weekly_timesheet'), path: '/tasks/timesheet', icon: <CalendarMonthOutlinedIcon /> },
        { label: t('nav.my_reviews'), path: '/reviews', icon: <RateReviewOutlinedIcon /> },
        { label: t('nav.my_projects'), path: '/projects', icon: <FolderOutlinedIcon /> },
      ],
    },
    ...(isSenior || isPM
      ? [
        {
          group: t('nav.management_approvals'),
          items: [
            { label: t('nav.task_approvals'), path: '/tasks/approvals', icon: <HowToRegOutlinedIcon /> },
            { label: t('nav.team_reviews'), path: '/reviews/team', icon: <RateReviewOutlinedIcon /> },
            ...(isSenior ? [{ label: t('nav.my_team'), path: '/team', icon: <PeopleOutlinedIcon /> }] : []),
          ],
        },
      ]
      : []),
    ...(isHR
      ? [
        {
          group: t('nav.hr_administration'),
          items: [
            { label: t('nav.employees'), path: '/employees', icon: <PeopleOutlinedIcon /> },
            { label: t('nav.review_cycles'), path: '/cycles', icon: <CalendarMonthOutlinedIcon /> },
            { label: t('nav.criteria_library'), path: '/criteria', icon: <RuleOutlinedIcon /> },
            { label: t('nav.grade_rules'), path: '/grade-rules', icon: <VerifiedUserOutlinedIcon /> },
            { label: t('nav.calibration'), path: '/reviews/calibration', icon: <HowToRegOutlinedIcon /> },
            { label: t('nav.period_locks'), path: '/period-locks', icon: <LockClockOutlinedIcon /> },
          ],
        },
      ]
      : []),
    {
      group: t('nav.analytics_audits'),
      items: [
        { label: t('nav.reports'), path: '/reports', icon: <AssessmentOutlinedIcon /> },
        ...(isHR || isSuperAdmin
          ? [{ label: t('nav.audit_logs'), path: '/audit-logs', icon: <HistoryOutlinedIcon /> }]
          : []),
        ...(isSuperAdmin
          ? [{ label: t('nav.system_settings'), path: '/settings', icon: <SettingsOutlinedIcon /> }]
          : []),
      ],
    },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) {
      onDrawerToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ overflowY: 'auto', height: '100%', py: 2 }}>
      {isMobile && (
        <Box sx={{ px: 3, pb: 2, mb: 1, borderBottom: `1px solid ${COLORS.neutral.borderLight}` }}>
          <Logo size="sm" onClick={() => handleNav('/dashboard')} />
        </Box>
      )}
      {navItems.map((section, idx) => (
        <React.Fragment key={idx}>
          <List
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  backgroundColor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  px: 3,
                  py: 0.5,
                }}
              >
                {section.group}
              </ListSubheader>
            }
            sx={{ px: 1.5 }}
          >
            {section.items.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNav(item.path)}
                    selected={active}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      color: active ? COLORS.primary.main : 'text.primary',
                      backgroundColor: active ? COLORS.primary.subtleBg : 'transparent',
                      borderLeft: active ? `3px solid ${COLORS.primary.main}` : '3px solid transparent',
                      '&:hover': {
                        backgroundColor: active ? COLORS.primary.subtleHover : 'rgba(24, 113, 247, 0.04)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? COLORS.primary.main : 'text.secondary',
                        minWidth: 36,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          {idx < navItems.length - 1 && <Divider sx={{ my: 1.5, mx: 2, borderColor: COLORS.neutral.bgMuted }} />}
        </React.Fragment>
      ))}

      {/* Modern Version Footer */}
      <Box sx={{ mt: 'auto', p: 2, mx: 1.5, mb: 1, borderRadius: 2.5, bgcolor: 'rgba(24, 113, 247, 0.05)', border: `1px solid ${COLORS.primary.borderSubtle}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: COLORS.primary.main, fontSize: '0.78rem' }}>
            Excellent Web World
          </Typography>
          <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: COLORS.primary.main, color: COLORS.neutral.textWhite, fontSize: '0.65rem' }}>
            v3.0.0
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
          Enterprise Appraisal Suite
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            backgroundColor: COLORS.neutral.bgWhite,
            borderRight: `1px solid ${COLORS.neutral.borderLight}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            backgroundColor: COLORS.neutral.bgWhite,
            borderRight: `1px solid ${COLORS.neutral.borderLight}`,
            top: 64,
            height: 'calc(100vh - 64px)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
