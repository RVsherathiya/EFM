import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { criteriaApi, CriterionDto } from '../api/criteriaApi';
import { COLORS } from '../../../constants/colors';
import { ShimmerTableRows } from '../../../components/common/ShimmerLoader';

export const CriteriaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<CriterionDto | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(15);
  const [sortOrder, setSortOrder] = useState(1);
  const [formError, setFormError] = useState('');

  const { data: criteriaRes, isLoading } = useQuery({
    queryKey: ['criteria'],
    queryFn: () => criteriaApi.getCriteria(),
  });

  const criteria = criteriaRes?.data || [];
  const totalWeight = criteria.reduce((sum, c) => sum + (c.isActive ? c.weight : 0), 0);

  const createMutation = useMutation({
    mutationFn: (data: Partial<CriterionDto>) => criteriaApi.createCriterion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to save criterion');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CriterionDto> }) =>
      criteriaApi.updateCriterion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to update criterion');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => criteriaApi.deleteCriterion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
    },
  });

  const handleOpenAdd = () => {
    setEditingCriterion(null);
    setName('');
    setDescription('');
    setWeight(15);
    setSortOrder(criteria.length + 1);
    setFormError('');
    setOpenModal(true);
  };

  const handleOpenEdit = (c: CriterionDto) => {
    setEditingCriterion(c);
    setName(c.name);
    setDescription(c.description);
    setWeight(c.weight);
    setSortOrder(c.sortOrder);
    setFormError('');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingCriterion(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setFormError('Criterion name is required');
      return;
    }
    if (weight <= 0 || weight > 100) {
      setFormError('Weight must be between 1% and 100%');
      return;
    }

    const payload = {
      name,
      description,
      weight: Number(weight),
      sortOrder: Number(sortOrder),
      scoreDefinitions: [
        { score: 1, label: 'Below', description: 'Consistently fails to meet expectations' },
        { score: 2, label: 'Partially Meets', description: 'Meets some expectations but needs improvement' },
        { score: 3, label: 'Meets', description: 'Consistently meets role expectations and performance standards' },
        { score: 4, label: 'Exceeds', description: 'Consistently exceeds performance standards' },
        { score: 5, label: 'Outstanding', description: 'Exceptional performance that sets a company benchmark' },
      ],
    };

    if (editingCriterion) {
      updateMutation.mutate({ id: editingCriterion._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" color="text.primary">
            Review Criteria Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage performance assessment criteria, weights, and scoring definitions for bi-monthly appraisal cycles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ borderRadius: 2, px: 3, py: 1 }}
        >
          Add Criterion
        </Button>
      </Box>

      {/* Weight Summary Card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {totalWeight === 100 ? (
                <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 32 }} />
              ) : (
                <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 32 }} />
              )}
              <Box>
                <Typography variant="h5">
                  {totalWeight}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Active Weight (Must be exactly 100%)
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <LinearProgress
              variant="determinate"
              value={Math.min(totalWeight, 100)}
              color={totalWeight === 100 ? 'success' : totalWeight > 100 ? 'error' : 'warning'}
              sx={{ height: 10, borderRadius: 5 }}
            />
            {totalWeight !== 100 && (
              <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                The total criteria weight is {totalWeight}%. Please adjust criteria so the sum equals 100%.
              </Alert>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Criteria Table */}
      <Paper sx={{ borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
              <TableRow>
                <TableCell sx={{ width: 80 }}>Order</TableCell>
                <TableCell>Criterion Name & Description</TableCell>
                <TableCell sx={{ width: 120 }}>Weight</TableCell>
                <TableCell sx={{ width: 120 }}>Status</TableCell>
                <TableCell sx={{ width: 140 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <ShimmerTableRows rows={6} columns={5} hasAvatar={false} />
              ) : criteria.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No criteria found. Click "Add Criterion" to create standard assessment criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                criteria.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>#{c.sortOrder}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="text.primary">
                        {c.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {c.description || 'No detailed description provided.'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${c.weight}%`}
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.isActive ? 'Active' : 'Inactive'}
                        color={c.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Criterion">
                        <IconButton size="small" onClick={() => handleOpenEdit(c)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Criterion">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${c.name}"?`)) {
                              deleteMutation.mutate(c._id);
                            }
                          }}
                          color="error"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCriterion ? 'Edit Assessment Criterion' : 'Create New Criterion'}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Criterion Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quality of Work, Timeliness & Delivery"
              required
            />
            <TextField
              label="Description & Guidance"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear evaluation instructions for employees and managers..."
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Weight (%)"
                  type="number"
                  fullWidth
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  inputProps={{ min: 1, max: 100 }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Sort Order"
                  type="number"
                  fullWidth
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Criterion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
