import React, { useState } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, ReviewDto } from '../api/reviewsApi';
import { cyclesApi } from '../../cycles/api/cyclesApi';

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

export const CalibrationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewDto | null>(null);
  const [overriddenGrade, setOverriddenGrade] = useState('A');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const { data: cyclesRes } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => cyclesApi.getCycles(),
  });

  const cycles = cyclesRes?.data || [];

  const { data: reviewsRes, isLoading } = useQuery({
    queryKey: ['calibration-reviews', selectedCycleId],
    queryFn: () => reviewsApi.getCalibrationReviews(selectedCycleId || undefined),
  });

  const reviews = reviewsRes?.data || [];

  const overrideMutation = useMutation({
    mutationFn: ({ id, grade, reason }: { id: string; grade: string; reason: string }) =>
      reviewsApi.overrideGrade(id, grade, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibration-reviews'] });
      handleCloseOverride();
    },
    onError: (err: any) => {
      setOverrideError(err.response?.data?.error?.message || 'Failed to override grade');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.publishReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibration-reviews'] });
    },
  });

  const handleOpenOverride = (rev: ReviewDto) => {
    setSelectedReview(rev);
    setOverriddenGrade(rev.calculatedGrade || 'B+');
    setOverrideReason('');
    setOverrideError('');
    setOverrideModalOpen(true);
  };

  const handleCloseOverride = () => {
    setOverrideModalOpen(false);
    setSelectedReview(null);
  };

  const handleSaveOverride = () => {
    if (!overrideReason.trim() || overrideReason.length < 5) {
      setOverrideError('Mandatory override justification reason is required.');
      return;
    }
    if (selectedReview) {
      overrideMutation.mutate({
        id: selectedReview._id,
        grade: overriddenGrade,
        reason: overrideReason,
      });
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Appraisal Calibration & HR Overrides
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspect calculated grades, evaluate gap anomalies, manage HR overrides with mandatory audit justifications, and publish ratings.
          </Typography>
        </Box>
        <Box sx={{ minWidth: 220 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Filter by Appraisal Cycle"
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
          >
            <MenuItem value="">All Cycles</MenuItem>
            {cycles.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name} ({c.code})
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Reviews Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cycle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Final Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>HR Approval Flag</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} />
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No reviews currently in calibration or calculated state.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((rev) => {
                  const isExtremeGrade = rev.calculatedGrade === 'A+' || rev.calculatedGrade === 'C-';

                  return (
                    <TableRow key={rev._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {rev.employeeId?.firstName} {rev.employeeId?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rev.employeeId?.designation} • {rev.employeeId?.employeeCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{rev.cycleId?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {rev.finalScore !== undefined ? `${rev.finalScore.toFixed(2)}%` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rev.calculatedGrade || '—'}
                          color={
                            rev.calculatedGrade === 'A+'
                              ? 'success'
                              : rev.calculatedGrade === 'C-'
                              ? 'error'
                              : 'primary'
                          }
                          sx={{ fontWeight: 800, minWidth: 44 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={rev.status.replace('_', ' ')} size="small" />
                      </TableCell>
                      <TableCell>
                        {isExtremeGrade ? (
                          <Chip
                            icon={<WarningAmberIcon />}
                            label="HR Sign-off Required"
                            color="warning"
                            size="small"
                          />
                        ) : (
                          <Chip icon={<CheckCircleIcon />} label="Normal" color="default" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Override Grade">
                            <IconButton size="small" color="primary" onClick={() => handleOpenOverride(rev)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {rev.status === 'GRADE_CALCULATED' && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PublishIcon />}
                              onClick={() => publishMutation.mutate(rev._id)}
                              disabled={publishMutation.isPending}
                              sx={{ borderRadius: 1.5 }}
                            >
                              Publish
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Override Dialog */}
      <Dialog open={overrideModalOpen} onClose={handleCloseOverride} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>HR Grade Calibration Override</DialogTitle>
        <DialogContent dividers>
          {overrideError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {overrideError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Overriding the calculated grade will update the final appraisal result and create an immutable audit record.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              select
              label="New Final Grade *"
              fullWidth
              value={overriddenGrade}
              onChange={(e) => setOverriddenGrade(e.target.value)}
            >
              {GRADES.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Mandatory Override Justification Reason *"
              fullWidth
              multiline
              rows={3}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Explain why this grade was calibrated/overridden..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseOverride}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveOverride}
            disabled={overrideMutation.isPending}
          >
            {overrideMutation.isPending ? 'Saving...' : 'Confirm Override'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
