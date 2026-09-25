import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack as PrevIcon,
  ArrowForward as NextIcon,
  Send as SubmitIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, TaskDto } from '../api/tasksApi';
import { projectsApi, Project } from '../../projects/api/projectsApi';
import { PageHeader } from '../../../components/common/PageHeader';
import { ShimmerTableLoader } from '../../../components/common/ShimmerLoader';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { COLORS } from '../../../constants/colors';

export const WeeklyTimesheetPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Calculate Monday of current week
  const [currentMonday, setCurrentMonday] = React.useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  const [isLogOpen, setIsLogOpen] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Generate 7 days (Mon to Sun)
  const days = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentMonday]);

  const startDateStr = days[0].toISOString().split('T')[0];
  const endDateStr = days[6].toISOString().split('T')[0];

  // Fetch Projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getProjects({ limit: 100 }),
  });
  const projects: Project[] = projectsData?.projects || [];

  // Fetch weekly tasks
  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['timesheet-matrix', startDateStr, endDateStr],
    queryFn: () => tasksApi.getTimesheetGrid(startDateStr, endDateStr),
  });

  const tasks: TaskDto[] = matrixData?.data || [];

  // Submit all draft tasks for this week
  const draftTaskIds = tasks
    .filter((t) => t.approvalStatus === 'DRAFT' || (t as any).status === 'DRAFT' || t.approvalStatus === 'REJECTED')
    .map((t) => t._id);

  const submitWeekMutation = useMutation({
    mutationFn: async () => {
      if (draftTaskIds.length === 0) return;
      return tasksApi.submitTasks(draftTaskIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSuccessMessage(`Submitted ${draftTaskIds.length} task(s) for approval.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskDto> & { submit?: boolean }) => {
      return tasksApi.createTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSuccessMessage('Task logged successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
  });

  // Calculate day totals
  const dayTotals = days.map((day) => {
    const dayStr = day.toISOString().split('T')[0];
    return tasks
      .filter((t) => new Date(t.workDate).toISOString().split('T')[0] === dayStr)
      .reduce((sum, t) => sum + (t.hours || 0), 0);
  });

  const totalWeeklyHours = dayTotals.reduce((a, b) => a + b, 0);

  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  return (
    <Box>
      <PageHeader
        title="Weekly Timesheet Grid"
        subtitle={`Timesheet for ${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setIsLogOpen(true)}
            >
              Log Task
            </Button>
            <Button
              variant="contained"
              startIcon={<SubmitIcon />}
              onClick={() => submitWeekMutation.mutate()}
              disabled={draftTaskIds.length === 0 || submitWeekMutation.isPending}
            >
              Submit Week ({draftTaskIds.length} Drafts)
            </Button>
          </Box>
        }
      />

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {/* Week Navigator */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
          <Button startIcon={<PrevIcon />} onClick={handlePrevWeek} size="small">
            Previous Week
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {days[0].toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} – {days[6].toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Logged: <strong style={{ color: totalWeeklyHours > 40 ? COLORS.feedback.successDark : 'inherit' }}>{totalWeeklyHours} hrs</strong>
            </Typography>
          </Box>
          <Button endIcon={<NextIcon />} onClick={handleNextWeek} size="small">
            Next Week
          </Button>
        </CardContent>
      </Card>

      {/* Timesheet Table */}
      {isLoading ? (
        <ShimmerTableLoader rows={6} columns={10} />
      ) : (
        <Card>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell>Project & Category</TableCell>
                  <TableCell>Task Title</TableCell>
                  {days.map((d, i) => (
                    <TableCell key={i} align="center" sx={{ minWidth: 90 }}>
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="right" >Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        No tasks logged for this week. Click "Log Task" to start filling your timesheet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((t) => {
                    const taskDayStr = new Date(t.workDate).toISOString().split('T')[0];
                    const projectObj = typeof t.projectId === 'object' ? t.projectId : null;

                    return (
                      <TableRow key={t._id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {projectObj?.name || 'Project'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.category} • {t.isBillable ? 'Billable' : 'Non-Billable'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{t.title}</Typography>
                          <Chip
                            label={(t as any).status || t.approvalStatus}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20, mt: 0.5 }}
                          />
                        </TableCell>
                        {days.map((d, i) => {
                          const dStr = d.toISOString().split('T')[0];
                          const isThisDay = taskDayStr === dStr;
                          return (
                            <TableCell key={i} align="center" sx={{ bgcolor: isThisDay ? 'action.hover' : 'inherit' }}>
                              {isThisDay ? (
                                <Typography variant="body2" sx={{ color: 'primary.main' }}>
                                  {t.hours}h
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell align="right" >
                          {t.hours}h
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* Day Summary Row */}
                <TableRow sx={{ bgcolor: 'action.selected' }}>
                  <TableCell colSpan={2}>
                    Daily Total Hours
                  </TableCell>
                  {dayTotals.map((tot, i) => (
                    <TableCell key={i} align="center">
                      <Typography
                        variant="body2"
                        sx={{

                          color: tot > 12 ? 'warning.main' : tot > 0 ? 'text.primary' : 'text.disabled',
                        }}
                      >
                        {tot > 0 ? `${tot}h` : '0h'}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="right" sx={{ color: 'primary.main' }}>
                    {totalWeeklyHours}h
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSubmit={async (data) => {
          await saveTaskMutation.mutateAsync(data);
        }}
        projects={projects}
      />
    </Box>
  );
};
