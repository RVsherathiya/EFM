import React from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as OpenIcon,
  CheckCircle as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cyclesApi, CycleDto } from '../api/cyclesApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { StatusBadge } from '../../../components/feedback/StatusBadge';

export const CyclesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [newCycle, setNewCycle] = React.useState({
    year: new Date().getFullYear(),
    cycleNumber: 1,
    name: '',
    periodStart: '2026-01-01',
    periodEnd: '2026-02-28',
    selfReviewStart: '2026-03-01',
    selfReviewEnd: '2026-03-05',
    seniorReviewStart: '2026-03-06',
    seniorReviewEnd: '2026-03-10',
    pmReviewStart: '2026-03-11',
    pmReviewEnd: '2026-03-14',
    gradeCalibrationStart: '2026-03-15',
    gradeCalibrationEnd: '2026-03-17',
    publishDate: '2026-03-18',
    description: '',
  });

  const { data: cyclesData, isLoading } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => cyclesApi.getCycles(),
  });

  const cycles: CycleDto[] = cyclesData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => cyclesApi.createCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      setIsCreateOpen(false);
      setActionSuccess('Review cycle created and criteria template snapshotted.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const openMutation = useMutation({
    mutationFn: async (id: string) => cyclesApi.openCycle(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      setActionSuccess(`Cycle opened! Initiated appraisal reviews for ${res.data.reviewsInitiated} active employees.`);
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: string) => cyclesApi.closeCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycles'] });
      setActionSuccess('Review cycle closed.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const handleCreate = async () => {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        ...newCycle,
        name: newCycle.name || `${newCycle.year}-C${newCycle.cycleNumber} Appraisal Cycle`,
      });
    } catch (err: any) {
      setFormError(err?.response?.data?.error?.message || err?.message || 'Failed to create cycle.');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Appraisal Review Cycles"
        subtitle="Configure bi-monthly appraisal schedules, stage timeline bounds, and initiate employee review cycles."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsCreateOpen(true)}>
            Schedule New Cycle
          </Button>
        }
      />

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {actionSuccess}
        </Alert>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading review cycles..." />
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Cycle Code & Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Review Stages</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycles.map((cycle) => (
                  <TableRow key={cycle._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {cycle.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cycle.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(cycle.periodStart).toLocaleDateString()} – {new Date(cycle.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Self: {new Date(cycle.selfReviewStart).toLocaleDateString()} - {new Date(cycle.selfReviewEnd).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Senior: {new Date(cycle.seniorReviewStart).toLocaleDateString()} - {new Date(cycle.seniorReviewEnd).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        PM: {new Date(cycle.pmReviewStart).toLocaleDateString()} - {new Date(cycle.pmReviewEnd).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cycle.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {cycle.status === 'PLANNED' && (
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<OpenIcon />}
                            onClick={() => openMutation.mutate(cycle._id)}
                            disabled={openMutation.isPending}
                          >
                            Open Cycle
                          </Button>
                        )}
                        {cycle.status === 'OPEN' && (
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<CloseIcon />}
                            onClick={() => closeMutation.mutate(cycle._id)}
                            disabled={closeMutation.isPending}
                          >
                            Close Cycle
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Create Cycle Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule Bi-Monthly Appraisal Cycle</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={newCycle.year}
                onChange={(e) => setNewCycle({ ...newCycle, year: parseInt(e.target.value, 10) || 2026 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cycle (1 to 6)"
                type="number"
                inputProps={{ min: 1, max: 6 }}
                fullWidth
                value={newCycle.cycleNumber}
                onChange={(e) => setNewCycle({ ...newCycle, cycleNumber: parseInt(e.target.value, 10) || 1 })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Appraisal Period Start"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.periodStart}
                onChange={(e) => setNewCycle({ ...newCycle, periodStart: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Appraisal Period End"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.periodEnd}
                onChange={(e) => setNewCycle({ ...newCycle, periodEnd: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Self Review Start"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.selfReviewStart}
                onChange={(e) => setNewCycle({ ...newCycle, selfReviewStart: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Self Review End (Day 5)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.selfReviewEnd}
                onChange={(e) => setNewCycle({ ...newCycle, selfReviewEnd: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Senior Review Start (Day 6)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.seniorReviewStart}
                onChange={(e) => setNewCycle({ ...newCycle, seniorReviewStart: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Senior Review End (Day 10)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.seniorReviewEnd}
                onChange={(e) => setNewCycle({ ...newCycle, seniorReviewEnd: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="PM Review Start (Day 11)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.pmReviewStart}
                onChange={(e) => setNewCycle({ ...newCycle, pmReviewStart: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="PM Review End (Day 14)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newCycle.pmReviewEnd}
                onChange={(e) => setNewCycle({ ...newCycle, pmReviewEnd: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsCreateOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            Create Appraisal Cycle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
