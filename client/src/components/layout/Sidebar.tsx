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

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  userRoles?: string[];
}

const DRAWER_WIDTH = 260;

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle, userRoles = ['EMPLOYEE'] }) => {
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
      group: 'General',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon /> },
        { label: 'My Tasks', path: '/tasks', icon: <AssignmentOutlinedIcon /> },
        { label: 'Weekly Timesheet', path: '/tasks/timesheet', icon: <CalendarMonthOutlinedIcon /> },
        { label: 'My Reviews', path: '/reviews', icon: <RateReviewOutlinedIcon /> },
        { label: 'My Projects', path: '/projects', icon: <FolderOutlinedIcon /> },
      ],
    },
    ...(isSenior || isPM
      ? [
          {
            group: 'Management & Approvals',
            items: [
              { label: 'Task Approvals', path: '/tasks/approvals', icon: <HowToRegOutlinedIcon /> },
              { label: 'Team Reviews', path: '/reviews/team', icon: <RateReviewOutlinedIcon /> },
              ...(isSenior ? [{ label: 'My Team', path: '/team', icon: <PeopleOutlinedIcon /> }] : []),
            ],
          },
        ]
      : []),
    ...(isHR
      ? [
          {
            group: 'HR Administration',
            items: [
              { label: 'Employees', path: '/employees', icon: <PeopleOutlinedIcon /> },
              { label: 'Review Cycles', path: '/cycles', icon: <CalendarMonthOutlinedIcon /> },
              { label: 'Criteria Library', path: '/criteria', icon: <RuleOutlinedIcon /> },
              { label: 'Grade Rules & Simulator', path: '/grade-rules', icon: <VerifiedUserOutlinedIcon /> },
              { label: 'Calibration & Overrides', path: '/reviews/calibration', icon: <HowToRegOutlinedIcon /> },
              { label: 'Period Locks', path: '/period-locks', icon: <LockClockOutlinedIcon /> },
            ],
          },
        ]
      : []),
    {
      group: 'Analytics & Audits',
      items: [
        { label: 'Reports', path: '/reports', icon: <AssessmentOutlinedIcon /> },
        ...(isHR || isSuperAdmin
          ? [{ label: 'Audit Logs', path: '/audit-logs', icon: <HistoryOutlinedIcon /> }]
          : []),
        ...(isSuperAdmin
          ? [{ label: 'System Settings', path: '/settings', icon: <SettingsOutlinedIcon /> }]
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
      {navItems.map((section, idx) => (
        <React.Fragment key={idx}>
          <List
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  backgroundColor: 'transparent',
                  color: 'text.secondary',
                  fontWeight: 700,
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
                      color: active ? 'primary.main' : 'text.primary',
                      backgroundColor: active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: active ? 'rgba(37, 99, 235, 0.12)' : 'rgba(0, 0, 0, 0.03)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        minWidth: 36,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: active ? 600 : 500,
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          {idx < navItems.length - 1 && <Divider sx={{ my: 1.5, mx: 2, borderColor: '#F1F5F9' }} />}
        </React.Fragment>
      ))}
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
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
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
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
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
