import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export type StatusType =
  | 'DRAFT'
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'PUBLISHED'
  | 'ACKNOWLEDGED'
  | 'DISPUTED'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: ChipProps['size'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'small' }) => {
  const displayLabel = label || status.replace(/_/g, ' ');

  let color: ChipProps['color'] = 'default';
  let variant: ChipProps['variant'] = 'filled';

  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'COMPLETED':
    case 'ACKNOWLEDGED':
      color = 'success';
      break;

    case 'SUBMITTED':
    case 'SELF_SUBMITTED':
    case 'SENIOR_SUBMITTED':
    case 'PM_SUBMITTED':
    case 'GRADE_CALCULATED':
      color = 'primary';
      break;

    case 'PENDING':
    case 'SELF_PENDING':
    case 'SENIOR_PENDING':
    case 'PM_PENDING':
    case 'PLANNED':
      color = 'warning';
      break;

    case 'REJECTED':
    case 'CANCELLED':
    case 'DISPUTED':
      color = 'error';
      break;

    case 'DRAFT':
    case 'ON_HOLD':
    default:
      color = 'default';
      variant = 'outlined';
      break;
  }

  return (
    <Chip
      label={displayLabel}
      color={color}
      variant={variant}
      size={size}
      sx={{
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        textTransform: 'capitalize',
      }}
    />
  );
};
