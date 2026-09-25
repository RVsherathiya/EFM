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
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  TablePagination,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TaskDto } from '../api/tasksApi';
import { projectsApi, Project } from '../../projects/api/projectsApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { ShimmerTableLoader } from '../../../components/common/ShimmerLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { TaskFormDialog } from '../components/TaskFormDialog';

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [projectFilter, setProjectFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<TaskDto | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Projects query
  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getProjects({ limit: 100 }),
  });

  const projects: Project[] = projectsData?.projects || [];

  // Tasks query
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', page, rowsPerPage, search, projectFilter, statusFilter],
    queryFn: () =>
      tasksApi.getTasks({
        page: page + 1,
        limit: rowsPerPage,
        projectId: projectFilter || undefined,
        approvalStatus: statusFilter || undefined,
      }),
  });

  const tasks = tasksData?.data || [];
  const totalTasks = tasksData?.meta?.total || 0;

  // Create/Update Task Mutation
  const saveTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskDto> & { submit?: boolean }) => {
      if (editingTask) {
        return tasksApi.updateTask(editingTask._id, data);
      } else {
        return tasksApi.createTask(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-matrix'] });
      setActionSuccess(editingTask ? 'Task updated successfully.' : 'Task created successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
      setEditingTask(null);
    },
  });

  // Submit Draft Task Mutation
  const submitTaskMutation = useMutation({
    mutationFn: async (taskId: string) => tasksApi.submitTasks([taskId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActionSuccess('Task submitted for approval.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  // Delete Task Mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setActionSuccess('Task deleted successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  return (
    <Box>
      <PageHeader
        title="My Tasks & Daily Logs"
        subtitle="Log hours, assign project deliverables, and track timesheet approval statuses"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTask(null);
              setIsCreateOpen(true);
            }}
          >
            Log New Task
          </Button>
        }
      />

      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {actionSuccess}
        </Alert>
      )}

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                placeholder="Search tasks..."
                fullWidth
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      {isLoading ? (
        <ShimmerTableLoader rows={6} columns={7} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks logged yet"
          description="Start logging your daily effort to maintain real-time project metrics and timesheets."
          actionText="Log Your First Task"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Title / Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell>Billable</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => {
                  const projectObj = typeof task.projectId === 'object' ? task.projectId : null;
                  const isApproved = task.approvalStatus === 'APPROVED';
                  const isDraft = task.approvalStatus === 'DRAFT';
                  const isRejected = task.approvalStatus === 'REJECTED';

                  return (
                    <TableRow key={task._id} hover>
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
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300 }} noWrap>
                          {task.description}
                        </Typography>
                        {isRejected && task.rejectionReason && (
                          <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
                            Reason: {task.rejectionReason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={task.category} size="small" variant="outlined" />
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
                      <TableCell>
                        <StatusBadge status={task.approvalStatus} />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {(isDraft || isRejected) && (
                            <>
                              <Tooltip title="Submit for Approval">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => submitTaskMutation.mutate(task._id)}
                                >
                                  <SendIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Task">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsCreateOpen(true);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => deleteTaskMutation.mutate(task._id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {isApproved && (
                            <Tooltip title="Approved & Immutable (BR-TASK-003)">
                              <CheckIcon fontSize="small" color="success" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalTasks}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (data) => {
          await saveTaskMutation.mutateAsync(data);
        }}
        initialData={editingTask}
        projects={projects}
      />
    </Box>
  );
};
