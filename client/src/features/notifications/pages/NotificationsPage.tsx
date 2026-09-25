import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationDto } from '../api/notificationsApi';
import { COLORS } from '../../../constants/colors';
import { ShimmerListLoader } from '../../../components/common/ShimmerLoader';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notificationsRes, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getMyNotifications(50),
  });

  const notifications = notificationsRes?.data?.notifications || [];
  const unreadCount = notificationsRes?.data?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (item: NotificationDto) => {
    if (!item.readAt) {
      markReadMutation.mutate(item._id);
    }
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" color="text.primary">
            Notifications & Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with review milestones, pending approvals, cycle openings, and project changes.
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadOutlinedIcon />}
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            sx={{ borderRadius: 2 }}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, overflow: 'hidden' }}>
        {isLoading ? (
          <ShimmerListLoader rows={6} />
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <NotificationsOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              No notifications yet. You are completely up to date!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((item, index) => (
              <React.Fragment key={item._id}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2,
                    backgroundColor: item.readAt ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                    cursor: item.linkUrl ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => handleNotificationClick(item)}
                  secondaryAction={
                    item.linkUrl && (
                      <IconButton edge="end" size="small">
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {!item.readAt ? (
                      <CircleIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                    ) : (
                      <CircleIcon sx={{ fontSize: 10, color: COLORS.neutral.border }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2">
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.type.replace('_', ' ')}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};
