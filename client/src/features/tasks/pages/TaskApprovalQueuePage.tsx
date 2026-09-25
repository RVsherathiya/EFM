import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TaskDto } from '../api/tasksApi';
import { projectsApi, Project } from '../../projects/api/projectsApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { ShimmerTableLoader } from '../../../components/common/ShimmerLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import { TaskRejectDialog } from '../components/TaskRejectDialog';

export const TaskApprovalQueuePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [projectFilter, setProjectFilter] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Projects query
  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getProjects({ limit: 100 }),
  });
  const projects: Project[] = projectsData?.projects || [];

  // Approval Queue Query
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['task-approvals', projectFilter],
    queryFn: () => tasksApi.getApprovalQueue({ projectId: projectFilter || undefined }),
  });

  const tasks: TaskDto[] = approvalsData?.data || [];

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (action: 'APPROVE_BILLABLE' | 'APPROVE_NON_BILLABLE') => {
      return tasksApi.approveTasks({ taskIds: selectedIds, action });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['task-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedIds([]);
      setActionSuccess(`Approved ${selectedIds.length} task(s) as ${action === 'APPROVE_BILLABLE' ? 'Billable' : 'Non-Billable'}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      return tasksApi.rejectTasks({ taskIds: selectedIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedIds([]);
      setActionSuccess('Selected tasks have been rejected.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tasks.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  return (
    <Box>
      <PageHeader
        title="Timesheet Approval Queue"
        subtitle="Review submitted effort from your team and managed projects. Approve billable/non-billable hours or reject with mandatory comments (BR-TASK-004)."
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => approveMutation.mutate('APPROVE_BILLABLE')}
              disabled={selectedIds.length === 0 || approveMutation.isPending}
            >
              Approve Billable ({selectedIds.length})
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => approveMutation.mutate('APPROVE_NON_BILLABLE')}
              disabled={selectedIds.length === 0 || approveMutation.isPending}
            >
              Approve Non-Billable ({selectedIds.length})
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => setIsRejectOpen(true)}
              disabled={selectedIds.length === 0 || rejectMutation.isPending}
            >
              Reject ({selectedIds.length})
            </Button>
          </Box>
        }
      />

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {actionSuccess}
        </Alert>
      )}

      {/* Filter Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filter by Project"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((p: Project) => (
                  <MenuItem key={p._id} value={p._id}>
                    [{p.projectCode}] {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      {isLoading ? (
        <ShimmerTableLoader rows={6} columns={7} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="All Caught Up!"
          description="There are no pending timesheets or task logs waiting for your approval."
        />
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < tasks.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Task Title & Category</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell>Requested As</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => {
                  const userObj = typeof task.userId === 'object' ? task.userId : null;
                  const projectObj = typeof task.projectId === 'object' ? task.projectId : null;
                  const isSelected = selectedIds.includes(task._id);

                  return (
                    <TableRow
                      key={task._id}
                      hover
                      selected={isSelected}
                      onClick={() => handleToggleSelect(task._id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {userObj?.firstName} {userObj?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {userObj?.employeeCode}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(task.workDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {projectObj?.name || 'Project'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {projectObj?.projectCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 280 }} noWrap>
                          {task.description}
                        </Typography>
                        <Chip label={task.category} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        {task.hours}h
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.isBillable ? 'Billable' : 'Non-Billable'}
                          size="small"
                          color={task.isBillable ? 'primary' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Task Reject Dialog */}
      <TaskRejectDialog
        open={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        count={selectedIds.length}
        onConfirm={async (reason) => {
          await rejectMutation.mutateAsync(reason);
        }}
      />
    </Box>
  );
};
