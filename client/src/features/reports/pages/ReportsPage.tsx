import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  MenuItem,
  Pagination,
  LinearProgress,
} from '@mui/material';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import { reportsApi } from '../api/reportsApi';
import { COLORS, CHART_COLORS } from '../../../constants/colors';
import { projectsApi } from '../../projects/api/projectsApi';
import { ShimmerTableRows, ShimmerCardsLoader } from '../../../components/common/ShimmerLoader';

const formatReportDate = (val?: string | Date) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return String(val).split('T')[0] || String(val);
    }
    return d.toISOString().split('T')[0];
  } catch {
    return String(val || '-');
  }
};

export const ReportsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const filterParams = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    projectId: projectId || undefined,
    category: category || undefined,
  };

  const { data: projectsRes } = useQuery({
    queryKey: ['projects-lookup'],
    queryFn: () => projectsApi.getProjects(),
  });

  const projects = projectsRes?.projects || [];

  // Tab 0: Timesheet
  const { data: timesheetRes, isLoading: loadingTimesheet } = useQuery({
    queryKey: ['report-timesheet', filterParams, page],
    queryFn: () => reportsApi.getTimesheetReport({ ...filterParams, page, limit: 15 }),
    enabled: tab === 0,
  });

  // Tab 1: Project Effort
  const { data: effortRes, isLoading: loadingEffort } = useQuery({
    queryKey: ['report-effort', filterParams],
    queryFn: () => reportsApi.getProjectEffortReport(filterParams),
    enabled: tab === 1,
  });

  // Tab 2: Utilisation
  const { data: utilisationRes, isLoading: loadingUtilisation } = useQuery({
    queryKey: ['report-utilisation', filterParams],
    queryFn: () => reportsApi.getUtilisationReport(filterParams),
    enabled: tab === 2,
  });

  // Tab 3: Category Breakdown
  const { data: categoryRes } = useQuery({
    queryKey: ['report-category', filterParams],
    queryFn: () => reportsApi.getCategoryBreakdown(filterParams),
    enabled: tab === 3,
  });

  // Tab 4: Billable Summary
  const { data: billableRes, isLoading: loadingBillable } = useQuery({
    queryKey: ['report-billable-summary', filterParams],
    queryFn: () => reportsApi.getBillableSummary(filterParams),
    enabled: tab === 4,
  });

  const timesheetData = timesheetRes?.data?.tasks || [];
  const pagination = timesheetRes?.data?.pagination;
  const effortData = effortRes?.data || [];
  const utilisationData = utilisationRes?.data || [];
  const categoryData = categoryRes?.data || [];
  const billableData = billableRes?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" color="text.primary">
            Reports & Workforce Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive audit-ready reports on timesheets, project effort, employee utilisation, and billing breakdown.
          </Typography>
        </Box>
      </Box>

      {/* Global Filter Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              size="small"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              size="small"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Project"
              fullWidth
              size="small"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name} ({p.projectCode})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Filter by Category"
              fullWidth
              size="small"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {['Development', 'Testing', 'Design', 'Meeting', 'Documentation', 'Support', 'Training', 'Other'].map(
                (c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<AssessmentOutlinedIcon />} iconPosition="start" label="Timesheet Logs" />
          <Tab icon={<FolderOutlinedIcon />} iconPosition="start" label="Project Effort" />
          <Tab icon={<PeopleOutlinedIcon />} iconPosition="start" label="Utilisation %" />
          <Tab icon={<CategoryOutlinedIcon />} iconPosition="start" label="Category Distribution" />
          <Tab icon={<MonetizationOnOutlinedIcon />} iconPosition="start" label="Executive Billable Summary" />
        </Tabs>

        {/* TAB 0: Timesheet Report */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => reportsApi.downloadTimesheetCsv(filterParams)}
                sx={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Billable</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Task Title</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTimesheet ? (
                    <ShimmerTableRows rows={6} columns={8} hasAvatar={true} />
                  ) : timesheetData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No timesheet records match the selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    timesheetData.map((t) => (
                      <TableRow key={t._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {t.userId?.firstName} {t.userId?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.userId?.employeeCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {t.projectId?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.projectId?.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatReportDate((t as any).workDate || (t as any).taskDate)}</TableCell>
                        <TableCell>
                          <Chip label={t.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{t.hours}h</TableCell>
                        <TableCell>
                          <Chip
                            label={Boolean((t as any).billable ?? (t as any).isBillable) ? 'Billable' : 'Non-Billable'}
                            color={Boolean((t as any).billable ?? (t as any).isBillable) ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            color={
                              t.status === 'APPROVED' ? 'success' : t.status === 'REJECTED' ? 'error' : 'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap>
                            {t.title}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {pagination && pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1: Project Effort Report */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => reportsApi.downloadProjectEffortCsv(filterParams)}
                sx={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
                  <TableRow>
                    <TableCell>Project Code & Name</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Billable Hours</TableCell>
                    <TableCell>Non-Billable Hours</TableCell>
                    <TableCell>Billable %</TableCell>
                    <TableCell>Tasks Logged</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingEffort ? (
                    <ShimmerTableRows rows={6} columns={6} hasAvatar={false} />
                  ) : effortData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No project effort data found for the given criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    effortData.map((e) => (
                      <TableRow key={e._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {e.projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{e.totalHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main'}}>{e.billableHours}h</TableCell>
                        <TableCell color="text.secondary">{e.nonBillableHours}h</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={e.billablePercentage || 0}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">
                              {e.billablePercentage?.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{e.taskCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: Project Effort */}
        {tab === 1 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1">
                Project Effort & Allocation Analytics
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => reportsApi.downloadProjectEffortCsv(filterParams)}
                sx={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Box>

            {effortData.length > 0 && (
              <Box sx={{ width: '100%', height: 260, mb: 3, p: 2, bgcolor: COLORS.neutral.bgHover, borderRadius: 2.5, border: `1px solid ${COLORS.neutral.borderLight}` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effortData.slice(0, 8)} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.neutral.borderLight} />
                    <XAxis dataKey="projectName" tick={{ fontSize: 11, fill: COLORS.neutral.textSlate }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.neutral.textSlate }} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: COLORS.neutral.darkCard, borderRadius: 8, border: 'none', color: COLORS.neutral.textWhite, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="billableHours" name="Billable (hrs)" fill={COLORS.accent.blueAlt} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="nonBillableHours" name="Non-Billable (hrs)" fill={COLORS.neutral.textMuted} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
                  <TableRow>
                    <TableCell>Project Code & Name</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Billable Hours</TableCell>
                    <TableCell>Non-Billable Hours</TableCell>
                    <TableCell>Billable %</TableCell>
                    <TableCell>Tasks Logged</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingEffort ? (
                    <ShimmerTableRows rows={6} columns={6} hasAvatar={false} />
                  ) : effortData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No project effort data found for the given criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    effortData.map((e) => (
                      <TableRow key={e._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {e.projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{e.totalHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main'}}>{e.billableHours}h</TableCell>
                        <TableCell color="text.secondary">{e.nonBillableHours}h</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={e.billablePercentage || 0}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">
                              {e.billablePercentage?.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{e.taskCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 2: Utilisation Report */}
        {tab === 2 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1">
                Workforce Capacity & Utilisation Efficiency
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={() => reportsApi.downloadUtilisationCsv(filterParams)}
                sx={{ borderRadius: 2 }}
              >
                Export CSV
              </Button>
            </Box>

            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Total Logged</TableCell>
                    <TableCell>Billable Hours</TableCell>
                    <TableCell>Approved Hours</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Utilisation %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUtilisation ? (
                    <ShimmerTableRows rows={6} columns={7} hasAvatar={true} />
                  ) : utilisationData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body1" color="text.secondary">
                          No utilisation records available for the selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    utilisationData.map((u) => (
                      <TableRow key={u._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {u.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.employeeCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{u.designation || 'Staff'}</TableCell>
                        <TableCell>{u.totalLoggedHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main'}}>{u.billableHours}h</TableCell>
                        <TableCell>{u.approvedHours}h</TableCell>
                        <TableCell>{u.workingCapacityHours}h</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(u.utilisationPct, 100)}
                              color={u.utilisationPct >= 80 ? 'success' : u.utilisationPct >= 50 ? 'primary' : 'warning'}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">
                              {u.utilisationPct?.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 3: Category Breakdown */}
        {tab === 3 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={3}>
              {categoryData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ width: '100%', height: 300, p: 2, bgcolor: COLORS.neutral.bgHover, borderRadius: 2.5, border: `1px solid ${COLORS.neutral.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData.map((c) => ({ name: c._id, value: c.totalHours }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(v: number) => [`${v} hours`, 'Hours']}
                          contentStyle={{ backgroundColor: COLORS.neutral.darkCard, borderRadius: 8, border: 'none', color: COLORS.neutral.textWhite, fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} md={categoryData.length > 0 ? 6 : 12}>
                <Grid container spacing={2}>
                  {categoryData.map((c) => (
                    <Grid item xs={12} sm={6} key={c._id}>
                      <Card sx={{ border: `1px solid ${COLORS.neutral.borderLight}`, borderRadius: 2.5, boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                            {c._id}
                          </Typography>
                          <Typography variant="h5" sx={{ my: 0.5 }} color="primary.main">
                            {c.totalHours} hrs
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.taskCount} total logged tasks
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 4: Executive Billable Summary */}
        {tab === 4 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {loadingBillable ? (
              <ShimmerCardsLoader cards={4} columns={{ xs: 12, sm: 6, md: 3 }} />
            ) : billableData ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: `1px solid ${COLORS.neutral.borderLight}`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Logged Hours
                      </Typography>
                      <Typography variant="h4" sx={{ my: 1 }}>
                        {billableData.totalHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {billableData.totalTasks} total tasks logged
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: `1px solid ${COLORS.neutral.borderLight}`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Billable Hours
                      </Typography>
                      <Typography variant="h4" color="success.main" sx={{ my: 1 }}>
                        {billableData.billableHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Billable Ratio: {billableData.billablePercentage?.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: `1px solid ${COLORS.neutral.borderLight}`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Approved Hours
                      </Typography>
                      <Typography variant="h4" color="primary.main" sx={{ my: 1 }}>
                        {billableData.approvedHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Verified by Senior/PM
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: `1px solid ${COLORS.neutral.borderLight}`, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pending Approvals
                      </Typography>
                      <Typography variant="h4" color="warning.main" sx={{ my: 1 }}>
                        {billableData.pendingHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Awaiting managerial review
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Donut chart for summary */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, bgcolor: COLORS.neutral.bgHover }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Billable vs Non-Billable Effort
                    </Typography>
                    <Box sx={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Billable', value: billableData.billableHours },
                              { name: 'Non-Billable', value: billableData.nonBillableHours },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill={COLORS.accent.blueAlt} />
                            <Cell fill={COLORS.neutral.textMuted} />
                          </Pie>
                          <ChartTooltip
                            formatter={(v: number) => [`${v} hours`, 'Effort']}
                            contentStyle={{ backgroundColor: COLORS.neutral.darkCard, borderRadius: 8, border: 'none', color: COLORS.neutral.textWhite, fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, bgcolor: COLORS.neutral.bgHover }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Approval Pipeline Ratio
                    </Typography>
                    <Box sx={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Approved', value: billableData.approvedHours },
                              { name: 'Pending', value: billableData.pendingHours },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill={COLORS.feedback.success} />
                            <Cell fill={COLORS.feedback.warning} />
                          </Pie>
                          <ChartTooltip
                            formatter={(v: number) => [`${v} hours`, 'Hours']}
                            contentStyle={{ backgroundColor: COLORS.neutral.darkCard, borderRadius: 8, border: 'none', color: COLORS.neutral.textWhite, fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            ) : null}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
