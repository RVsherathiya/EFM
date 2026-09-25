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
  Grid,
  TextField,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api/apiClient';
import { COLORS } from '../../../constants/colors';
import { ShimmerTableRows } from '../../../components/common/ShimmerLoader';

interface AuditLogDto {
  _id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeCode: string;
  };
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  SUBMIT: 'primary',
  APPROVE: 'success',
  REJECT: 'error',
  OVERRIDE: 'warning',
  PUBLISH: 'secondary',
  LOGIN: 'default',
};

export const AuditLogsPage: React.FC = () => {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ['audit-logs', { entityType, action, page }],
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: { logs: AuditLogDto[]; pagination: { total: number; page: number; totalPages: number } };
      }>('/audit-logs', {
        params: {
          entityType: entityType || undefined,
          action: action || undefined,
          page,
          limit: 20,
        },
      });
      return res.data;
    },
  });

  const logs = logsRes?.data?.logs || [];
  const pagination = logsRes?.data?.pagination;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="text.primary">
          System Audit Trail
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Immutable audit records of all sensitive operations, grade calibrations, approvals, hierarchy updates, and permissions.
        </Typography>
      </Box>

      {/* Filter Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Entity Type"
              fullWidth
              size="small"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Entities</MenuItem>
              {['USER', 'PROJECT', 'TASK', 'REVIEW', 'CYCLE', 'PERIOD_LOCK', 'DELEGATION', 'DEPARTMENT'].map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Action"
              fullWidth
              size="small"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Actions</MenuItem>
              {['CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'OVERRIDE', 'PUBLISH', 'LOGIN'].map(
                (a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell align="right">
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <ShimmerTableRows rows={6} columns={6} hasAvatar={false} />
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No audit log records found for the given criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        color={ACTION_COLORS[log.action] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {log.entityType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {log.entityId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.userId ? (
                        <Box>
                          <Typography variant="body2">
                            {log.userId.firstName} {log.userId.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.userId.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          System / Anonymous
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{log.ipAddress || '—'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityOutlinedIcon />}
                        onClick={() => setSelectedLog(log)}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={pagination.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Paper>

      {/* Detail JSON Modal */}
      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Audit Payload Detail — {selectedLog?.action} ({selectedLog?.entityType})
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            New Values / Changes:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2,
              backgroundColor: COLORS.neutral.darkSurface,
              color: COLORS.secondary.sky,
              borderRadius: 2,
              overflowX: 'auto',
              fontSize: '0.85rem',
              mb: 2,
            }}
          >
            {JSON.stringify(selectedLog?.newValues || {}, null, 2)}
          </Box>

          {selectedLog?.oldValues && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Previous Values:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  backgroundColor: COLORS.neutral.darkSurface,
                  color: COLORS.feedback.errorLight,
                  borderRadius: 2,
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                }}
              >
                {JSON.stringify(selectedLog.oldValues, null, 2)}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
