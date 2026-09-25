import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../features/notifications/api/notificationsApi';

import { Logo } from '../brand/Logo';
import { SignOutConfirmDialog } from '../common/SignOutConfirmDialog';
import { COLORS } from '../../constants/colors';

interface NavbarProps {
  onDrawerToggle: () => void;
  user?: {
    fullName: string;
    email: string;
    roles: string[];
    employeeCode: string;
  } | null;
  onLogout?: () => Promise<{ message?: string } | void> | void;
}

export const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle, user, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [signOutDialogOpen, setSignOutDialogOpen] = React.useState(false);

  const { data: notifRes } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getMyNotifications(5),
    refetchInterval: 30000,
  });

  const unreadCount = notifRes?.data?.unreadCount || 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setSignOutDialogOpen(true);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: COLORS.neutral.bgWhite,
        color: COLORS.neutral.textPrimary,
        borderBottom: `1px solid ${COLORS.neutral.borderLight}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label={t('navbar.toggle_menu')}
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Logo size="sm" portalName={t('navbar.portal_name')} onClick={() => navigate('/dashboard')} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={t('navbar.notifications')}>
            <IconButton color="inherit" onClick={() => navigate('/notifications')} size="large">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              p: '4px 8px',
              borderRadius: 2,
              '&:hover': { backgroundColor: COLORS.neutral.bgMuted },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: '0.9rem',
              }}
            >
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ lineHeight: 1.2 }}>
                {user?.fullName || t('navbar.user_fallback')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.roles?.[0] || 'EMPLOYEE'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: { width: 220, mt: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.fullName || t('navbar.user_fallback')}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email || ''}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonOutlineIcon fontSize="small" />
              </ListItemIcon>
              {t('navbar.profile')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              {t('navbar.sign_out')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Confirmation Sign Out Modal */}
      <SignOutConfirmDialog
        open={signOutDialogOpen}
        onClose={() => setSignOutDialogOpen(false)}
        user={user}
        onLogout={onLogout}
      />
    </AppBar>
  );
};
