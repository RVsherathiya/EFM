import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Avatar,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviewsApi';
import { COLORS } from '../../../constants/colors';
import { ShimmerTableRows } from '../../../components/common/ShimmerLoader';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'default',
  SELF_PENDING: 'warning',
  SELF_SUBMITTED: 'info',
  SENIOR_PENDING: 'warning',
  SENIOR_SUBMITTED: 'info',
  PM_PENDING: 'warning',
  PM_SUBMITTED: 'info',
  GRADE_CALCULATED: 'secondary',
  PUBLISHED: 'success',
  ACKNOWLEDGED: 'success',
  DISPUTED: 'error',
};

export const TeamReviewsPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: () => reviewsApi.getPendingReviews(),
  });

  const reviews = reviewsRes?.data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="text.primary">
          Team Appraisal Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pending performance reviews requiring your Senior or Project Manager assessment and rating submission.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Cycle Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Self Submitted</TableCell>
                <TableCell>Send Backs</TableCell>
                <TableCell align="right">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <ShimmerTableRows rows={5} columns={6} />
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <AssignmentTurnedInIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No pending team reviews at this moment. You are all caught up!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((rev) => (
                  <TableRow key={rev._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.875rem' }}>
                          {rev.employeeId?.firstName?.[0] || 'E'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {rev.employeeId?.firstName} {rev.employeeId?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rev.employeeId?.designation} • {rev.employeeId?.employeeCode}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {rev.cycleId?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rev.cycleId?.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rev.status.replace('_', ' ')}
                        color={STATUS_COLORS[rev.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {rev.selfSubmittedAt ? (
                        <Chip label="Yes" color="success" size="small" variant="outlined" />
                      ) : (
                        <Chip label="No (Auto redistributed)" color="default" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {rev.pmSendBackCount > 0 ? (
                        <Chip label={`${rev.pmSendBackCount}x Sent Back`} color="warning" size="small" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/reviews/${rev._id}`)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Evaluate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
