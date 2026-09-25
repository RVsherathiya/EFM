import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

interface TaskRejectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  count: number;
}

export const TaskRejectDialog: React.FC<TaskRejectDialogProps> = ({
  open,
  onClose,
  onConfirm,
  count,
}) => {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A rejection reason is mandatory (BR-TASK-004).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(reason);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to reject task(s).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: 'error.main' }}>
        Reject {count} Task{count > 1 ? 's' : ''}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please provide a clear justification for rejecting the selected task(s). The employee will be able to review your feedback, make corrections, and resubmit.
        </Typography>
        <TextField
          label="Rejection Reason"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Hours exceed estimate, incorrect project logged, or missing deliverable link..."
          required
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={loading || !reason.trim()}
        >
          Confirm Rejection
        </Button>
      </DialogActions>
    </Dialog>
  );
};
