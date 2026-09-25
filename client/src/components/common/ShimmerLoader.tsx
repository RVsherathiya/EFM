import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  keyframes,
  SxProps,
  Theme,
} from '@mui/material';
import { COLORS } from '../../constants/colors';

// Attractive liquid wave shimmer animation
export const shimmerWave = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const shimmerSx: SxProps<Theme> = {
  background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 25%, #FFFFFF 50%, #E2E8F0 75%, #F1F5F9 100%)',
  backgroundSize: '200% 100%',
  animation: `${shimmerWave} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
  borderRadius: 1.5,
};

export interface ShimmerItemProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  sx?: SxProps<Theme>;
}

export const ShimmerItem: React.FC<ShimmerItemProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 6,
  sx,
}) => {
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        ...shimmerSx,
        ...sx,
      }}
    />
  );
};

/* ─── Table Rows Shimmer (renders directly inside <TableBody>) ─── */
export interface ShimmerTableRowsProps {
  rows?: number;
  columns?: number;
  hasAvatar?: boolean;
}

export const ShimmerTableRows: React.FC<ShimmerTableRowsProps> = ({
  rows = 6,
  columns = 5,
  hasAvatar = true,
}) => {
  // Variations to make rows look natural
  const nameWidths = ['130px', '150px', '110px', '140px', '125px', '160px'];
  const subWidths = ['80px', '95px', '70px', '85px', '75px', '100px'];
  const colWidths = ['90px', '120px', '100px', '110px', '85px'];

  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <TableRow key={rIdx} sx={{ height: 68, '&:last-child td': { border: 0 } }}>
          {/* Column 0: Avatar + Name / Subtitle */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {hasAvatar && (
                <ShimmerItem width={38} height={38} borderRadius="50%" sx={{ flexShrink: 0 }} />
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
                <ShimmerItem
                  width={nameWidths[rIdx % nameWidths.length]}
                  height={15}
                  borderRadius={4}
                />
                <ShimmerItem
                  width={subWidths[rIdx % subWidths.length]}
                  height={12}
                  borderRadius={4}
                  sx={{ opacity: 0.7 }}
                />
              </Box>
            </Box>
          </TableCell>

          {/* Additional Dynamic Columns */}
          {Array.from({ length: Math.max(1, columns - 1) }).map((_, cIdx) => {
            const isLast = cIdx === columns - 2;
            const isSecondLast = cIdx === columns - 3;

            // Render status pill or action button for trailing columns
            if (isLast) {
              return (
                <TableCell key={cIdx} align="right" sx={{ py: 1.75, px: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <ShimmerItem width={32} height={32} borderRadius={2} />
                  </Box>
                </TableCell>
              );
            }

            if (isSecondLast && columns >= 4) {
              return (
                <TableCell key={cIdx} sx={{ py: 1.75, px: 2 }}>
                  <ShimmerItem width={74} height={24} borderRadius={12} />
                </TableCell>
              );
            }

            return (
              <TableCell key={cIdx} sx={{ py: 1.75, px: 2 }}>
                <ShimmerItem
                  width={colWidths[(rIdx + cIdx) % colWidths.length]}
                  height={14}
                  borderRadius={4}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
};

/* ─── Full Card Table Shimmer Loader ─── */
export interface ShimmerTableLoaderProps {
  rows?: number;
  columns?: number;
  hasAvatar?: boolean;
  hasHeader?: boolean;
  minHeight?: number | string;
  sx?: SxProps<Theme>;
}

export const ShimmerTableLoader: React.FC<ShimmerTableLoaderProps> = ({
  rows = 6,
  columns = 5,
  hasAvatar = true,
  hasHeader = true,
  sx,
}) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `1px solid ${COLORS.neutral.borderLight}`,
        boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden',
        ...sx,
      }}
    >
      <TableContainer component={Paper} elevation={0}>
        <Table>
          {hasHeader && (
            <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
              <TableRow sx={{ height: 48 }}>
                {Array.from({ length: columns }).map((_, hIdx) => (
                  <TableCell key={hIdx} sx={{ py: 1.5, px: 2 }}>
                    <ShimmerItem width={hIdx === 0 ? 120 : 80} height={14} borderRadius={4} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            <ShimmerTableRows rows={rows} columns={columns} hasAvatar={hasAvatar} />
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

/* ─── Card Grid Shimmer Loader (Projects, Dashboards) ─── */
export interface ShimmerCardsLoaderProps {
  cards?: number;
  count?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
}

export const ShimmerCardsLoader: React.FC<ShimmerCardsLoaderProps> = ({
  cards,
  count,
  columns = { xs: 12, sm: 6, md: 4 },
}) => {
  const numCards = count ?? cards ?? 6;
  return (
    <Grid container spacing={3}>
      {Array.from({ length: numCards }).map((_, idx) => (
        <Grid item key={idx} {...columns}>
          <Card
            sx={{
              borderRadius: '16px',
              border: `1px solid ${COLORS.neutral.borderLight}`,
              boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
              p: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              {/* Header: Chip + Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <ShimmerItem width={70} height={22} borderRadius={11} />
                <ShimmerItem width={60} height={20} borderRadius={10} />
              </Box>

              {/* Title & Description */}
              <ShimmerItem width="80%" height={20} borderRadius={4} sx={{ mb: 1.2 }} />
              <ShimmerItem width="95%" height={14} borderRadius={4} sx={{ mb: 0.8, opacity: 0.7 }} />
              <ShimmerItem width="60%" height={14} borderRadius={4} sx={{ mb: 2.5, opacity: 0.7 }} />

              {/* Progress bar simulation */}
              <ShimmerItem width="100%" height={8} borderRadius={4} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                <ShimmerItem width={50} height={12} borderRadius={3} />
                <ShimmerItem width={35} height={12} borderRadius={3} />
              </Box>
            </Box>

            {/* Footer: Avatars + Action */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: `1px solid ${COLORS.neutral.borderLight}` }}>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <ShimmerItem width={28} height={28} borderRadius="50%" />
                <ShimmerItem width={28} height={28} borderRadius="50%" />
                <ShimmerItem width={28} height={28} borderRadius="50%" />
              </Box>
              <ShimmerItem width={75} height={28} borderRadius={2} />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

/* ─── List Feed Shimmer Loader (Notifications, Activity Logs) ─── */
export interface ShimmerListLoaderProps {
  rows?: number;
}

export const ShimmerListLoader: React.FC<ShimmerListLoaderProps> = ({ rows = 5 }) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: `1px solid ${COLORS.neutral.borderLight}`,
        boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2.5,
              gap: 2,
              borderBottom: idx < rows - 1 ? `1px solid ${COLORS.neutral.borderLight}` : 'none',
            }}
          >
            <ShimmerItem width={42} height={42} borderRadius="50%" sx={{ flexShrink: 0 }} />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <ShimmerItem width={`${Math.floor(50 + (idx % 3) * 15)}%`} height={16} borderRadius={4} />
              <ShimmerItem width={`${Math.floor(70 + (idx % 2) * 15)}%`} height={13} borderRadius={4} sx={{ opacity: 0.7 }} />
            </Box>
            <ShimmerItem width={65} height={14} borderRadius={4} sx={{ flexShrink: 0 }} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

/* ─── Universal Shimmer Loader ─── */
export interface ShimmerLoaderProps {
  variant?: 'table' | 'table-rows' | 'cards' | 'list';
  rows?: number;
  columns?: number;
  cards?: number;
  hasAvatar?: boolean;
  hasHeader?: boolean;
  sx?: SxProps<Theme>;
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  variant = 'table',
  rows = 6,
  columns = 5,
  cards = 6,
  hasAvatar = true,
  hasHeader = true,
  sx,
}) => {
  switch (variant) {
    case 'table-rows':
      return <ShimmerTableRows rows={rows} columns={columns} hasAvatar={hasAvatar} />;
    case 'cards':
      return <ShimmerCardsLoader cards={cards} />;
    case 'list':
      return <ShimmerListLoader rows={rows} />;
    case 'table':
    default:
      return (
        <ShimmerTableLoader
          rows={rows}
          columns={columns}
          hasAvatar={hasAvatar}
          hasHeader={hasHeader}
          sx={sx}
        />
      );
  }
};
