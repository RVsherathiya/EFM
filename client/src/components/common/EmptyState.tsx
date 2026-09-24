import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There is currently no data to display for this view.',
  actionText,
  onAction,
  icon = <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.6 }} />,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 6,
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
        border: '1px dashed #CBD5E1',
        my: 2,
      }}
    >
      <Box sx={{ mb: 1.5 }}>{icon}</Box>
      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mb: actionText ? 2.5 : 0 }}>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} size="medium">
          {actionText}
        </Button>
      )}
    </Box>
  );
};
