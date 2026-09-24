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
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviewsApi';

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

export const MyReviewsPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.getMyReviews(),
  });

  const reviews = reviewsRes?.data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          My Performance Reviews
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your bi-monthly appraisal reviews, submit self-assessments, view final published grades, and acknowledge ratings.
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Total Reviews
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                {reviews.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bi-monthly appraisal records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Active Action Needed
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ my: 1 }}>
                {reviews.filter((r) => r.status === 'SELF_PENDING' || r.status === 'PUBLISHED').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending self-reviews or acknowledgements
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                Latest Published Grade
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ my: 1 }}>
                {reviews.find((r) => r.status === 'PUBLISHED' || r.status === 'ACKNOWLEDGED')?.calculatedGrade || '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Most recent finalized appraisal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reviews Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Cycle Period</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Senior Reviewer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Project Manager</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <RateReviewOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No review records found for your profile. Reviews will appear when an appraisal cycle opens.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((rev) => (
                  <TableRow key={rev._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {rev.cycleId?.name || 'Cycle'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rev.cycleId?.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {rev.seniorId ? `${rev.seniorId.firstName} ${rev.seniorId.lastName}` : 'Unassigned'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rev.seniorId?.designation}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {rev.pmId ? `${rev.pmId.firstName} ${rev.pmId.lastName}` : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rev.pmId?.designation || 'Project Manager'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rev.status.replace('_', ' ')}
                        color={STATUS_COLORS[rev.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {rev.status === 'PUBLISHED' || rev.status === 'ACKNOWLEDGED' ? (
                        <Chip
                          label={rev.calculatedGrade || '—'}
                          color="primary"
                          sx={{ fontWeight: 800, minWidth: 40 }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Pending Publish
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/reviews/${rev._id}`)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        {rev.status === 'SELF_PENDING'
                          ? 'Fill Self Review'
                          : rev.status === 'PUBLISHED'
                          ? 'View & Acknowledge'
                          : 'View Review'}
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
