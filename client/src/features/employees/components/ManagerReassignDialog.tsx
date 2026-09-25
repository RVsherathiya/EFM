import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Employee } from '../api/employeesApi';

interface ManagerReassignDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  allManagers: Employee[];
  onSubmit: (employeeId: string, managerId: string | null, reason: string) => Promise<void>;
}

export const ManagerReassignDialog: React.FC<ManagerReassignDialogProps> = ({
  open,
  onClose,
  employee,
  allManagers,
  onSubmit,
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (employee) {
      const currentManager = typeof employee.managerId === 'object' ? employee.managerId?._id : employee.managerId;
      setSelectedManagerId(currentManager || '');
      setReason('');
      setErrorMsg(null);
    }
  }, [employee, open]);

  const handleSubmit = async () => {
    if (!employee) return;
    if (!reason.trim()) {
      setErrorMsg('A reason for manager reassignment is required (BR-ORG-003).');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await onSubmit(employee._id, selectedManagerId || null, reason);
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(errorResponse?.response?.data?.error?.message || 'Failed to reassign manager.');
    } finally {
      setLoading(false);
    }
  };

  const eligibleManagers = allManagers.filter((m) => m._id !== employee?._id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Reassign Reporting Manager ({employee?.fullName})
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Changing an employee's manager updates the active reporting hierarchy and logs a permanent, effective-dated history record without altering past review cycles.
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            select
            fullWidth
            label="New Reporting Manager"
            value={selectedManagerId}
            onChange={(e) => setSelectedManagerId(e.target.value)}
            helperText="Select 'None' if this employee reports directly to Board/Top"
          >
            <MenuItem value="">None (Top Level / CEO)</MenuItem>
            {eligibleManagers.map((mgr) => (
              <MenuItem key={mgr._id} value={mgr._id}>
                {mgr.fullName} ({mgr.employeeCode} - {mgr.designation})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Reassignment"
            placeholder="e.g. Organizational realignment, promotion, team transfer..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Confirm Reassignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
