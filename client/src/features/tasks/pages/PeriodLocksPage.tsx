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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as UnlockIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, PeriodLockDto } from '../api/tasksApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { ShimmerTableLoader } from '../../../components/common/ShimmerLoader';

export const PeriodLocksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [unlockTargetMonth, setUnlockTargetMonth] = React.useState<string | null>(null);
  const [unlockReason, setUnlockReason] = React.useState('');
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  const { data: locksData, isLoading } = useQuery({
    queryKey: ['period-locks'],
    queryFn: () => tasksApi.getPeriodLocks(),
  });

  const locks: PeriodLockDto[] = locksData?.data || [];

  // Generate the last 6 months list so HR can unlock any recent past month even if not explicitly stored
  const months = React.useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      list.push(ym);
    }
    return list;
  }, []);

  const unlockMutation = useMutation({
    mutationFn: async ({ yearMonth, reason }: { yearMonth: string; reason: string }) => {
      return tasksApi.unlockPeriod(yearMonth, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['period-locks'] });
      setUnlockTargetMonth(null);
      setUnlockReason('');
      setActionSuccess(`Period ${variables.yearMonth} unlocked successfully. Timesheet edits are now permitted.`);
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  const handleConfirmUnlock = async () => {
    if (!unlockReason.trim()) {
      setUnlockError('A mandatory reason is required to unlock a locked timesheet period (BR-TASK-005).');
      return;
    }
    if (!unlockTargetMonth) return;

    setUnlockError(null);
    try {
      await unlockMutation.mutateAsync({ yearMonth: unlockTargetMonth, reason: unlockReason });
    } catch (err: any) {
      setUnlockError(err?.response?.data?.error?.message || err?.message || 'Failed to unlock period.');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Monthly Timesheet Period Locks"
        subtitle="Manage automated period closures (default: 5th of next month). HR Administrators can unlock previous periods with mandatory justification."
      />

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {actionSuccess}
        </Alert>
      )}

      {isLoading ? (
        <ShimmerTableLoader rows={6} columns={6} />
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell>Period (Year-Month)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Unlocked By</TableCell>
                  <TableCell>Unlock Reason</TableCell>
                  <TableCell>Unlocked At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {months.map((ym) => {
                  const record = locks.find((l) => l.yearMonth === ym);
                  const isExplicitlyUnlocked = record && !record.isLocked;

                  return (
                    <TableRow key={ym} hover>
                      <TableCell>
                        {ym}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={isExplicitlyUnlocked ? <UnlockIcon /> : <LockIcon />}
                          label={isExplicitlyUnlocked ? 'Unlocked by HR' : 'Locked'}
                          color={isExplicitlyUnlocked ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {record?.unlockedBy
                          ? `${record.unlockedBy.firstName} ${record.unlockedBy.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        {record?.unlockReason || '-'}
                      </TableCell>
                      <TableCell>
                        {record?.unlockedAt ? new Date(record.unlockedAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {!isExplicitlyUnlocked && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UnlockIcon />}
                            onClick={() => {
                              setUnlockTargetMonth(ym);
                              setUnlockReason('');
                              setUnlockError(null);
                            }}
                          >
                            Unlock Period
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Unlock Modal */}
      <Dialog
        open={!!unlockTargetMonth}
        onClose={() => setUnlockTargetMonth(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Unlock Period: {unlockTargetMonth}
        </DialogTitle>
        <DialogContent dividers>
          {unlockError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {unlockError}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Unlocking this period will allow employees to create, edit, and resubmit timesheet entries for <strong>{unlockTargetMonth}</strong>. This administrative action is strictly audit-logged.
          </Typography>
          <TextField
            label="Mandatory Unlock Justification"
            multiline
            rows={3}
            fullWidth
            value={unlockReason}
            onChange={(e) => setUnlockReason(e.target.value)}
            placeholder="e.g. Approved leave backlog correction requested by Director of Engineering..."
            required
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setUnlockTargetMonth(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmUnlock}
            disabled={unlockMutation.isPending || !unlockReason.trim()}
          >
            Confirm & Unlock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
