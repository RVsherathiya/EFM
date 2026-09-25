import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants/colors';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon = <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.6 }} />,
}) => {
  const { t } = useTranslation();
  const displayTitle = title ?? t('empty_states.default_title');
  const displayDescription = description ?? t('empty_states.default_description');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 6,
        textAlign: 'center',
        backgroundColor: COLORS.neutral.bgWhite,
        borderRadius: 3,
        border: `1px dashed ${COLORS.neutral.border}`,
        my: 2,
      }}
    >
      <Box sx={{ mb: 1.5 }}>{icon}</Box>
      <Typography variant="h6" color="text.primary" gutterBottom>
        {displayTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mb: actionText ? 2.5 : 0 }}>
        {displayDescription}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} size="medium">
          {actionText}
        </Button>
      )}
    </Box>
  );
};
