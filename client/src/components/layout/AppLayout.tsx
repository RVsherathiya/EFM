import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../features/auth/context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
      <Navbar onDrawerToggle={handleDrawerToggle} user={user} onLogout={logout} />
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle}
          userRoles={user?.roles || ['EMPLOYEE']}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2.5, md: 3.5 },
            width: { xs: '100%', md: `calc(100% - 260px)` },
            overflowX: 'hidden',
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 1 } }}>
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  );
};
