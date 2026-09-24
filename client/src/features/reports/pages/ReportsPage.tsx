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
  CircularProgress,
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
import { projectsApi } from '../../projects/api/projectsApi';

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
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Reports & Workforce Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive audit-ready reports on timesheets, project effort, employee utilisation, and billing breakdown.
          </Typography>
        </Box>
      </Box>

      {/* Global Filter Bar */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
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

      <Paper sx={{ borderRadius: 3, border: '1px solid #E2E8F0', mb: 3 }}>
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
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Task Title</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTimesheet ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} />
                      </TableCell>
                    </TableRow>
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
                          <Typography variant="subtitle2" fontWeight={600}>
                            {t.userId?.firstName} {t.userId?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.userId?.employeeCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
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
                        <TableCell sx={{ fontWeight: 700 }}>{t.hours}h</TableCell>
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
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Project Code & Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Non-Billable Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable %</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tasks Logged</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingEffort ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} />
                      </TableCell>
                    </TableRow>
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
                          <Typography variant="subtitle2" fontWeight={700}>
                            {e.projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{e.totalHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{e.billableHours}h</TableCell>
                        <TableCell color="text.secondary">{e.nonBillableHours}h</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={e.billablePercentage || 0}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" fontWeight={700}>
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
              <Typography variant="subtitle1" fontWeight={700}>
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
              <Box sx={{ width: '100%', height: 260, mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effortData.slice(0, 8)} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="projectName" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: '#1E293B', borderRadius: 8, border: 'none', color: '#FFF', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="billableHours" name="Billable (hrs)" fill="#2563EB" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="nonBillableHours" name="Non-Billable (hrs)" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Project Code & Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Non-Billable Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable %</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tasks Logged</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingEffort ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} />
                      </TableCell>
                    </TableRow>
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
                          <Typography variant="subtitle2" fontWeight={700}>
                            {e.projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.projectCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{e.totalHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{e.billableHours}h</TableCell>
                        <TableCell color="text.secondary">{e.nonBillableHours}h</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={e.billablePercentage || 0}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2" fontWeight={700}>
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
              <Typography variant="subtitle1" fontWeight={700}>
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
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Logged</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billable Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Approved Hours</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Utilisation %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingUtilisation ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} />
                      </TableCell>
                    </TableRow>
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
                          <Typography variant="subtitle2" fontWeight={700}>
                            {u.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.employeeCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{u.designation || 'Staff'}</TableCell>
                        <TableCell>{u.totalLoggedHours}h</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{u.billableHours}h</TableCell>
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
                            <Typography variant="body2" fontWeight={700}>
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
                  <Box sx={{ width: '100%', height: 300, p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                              fill={['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'][index % 7]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(v: number) => [`${v} hours`, 'Hours']}
                          contentStyle={{ backgroundColor: '#1E293B', borderRadius: 8, border: 'none', color: '#FFF', fontSize: 12 }}
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
                      <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 2.5, boxShadow: 'none' }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">
                            {c._id}
                          </Typography>
                          <Typography variant="h5" fontWeight={700} sx={{ my: 0.5 }} color="primary.main">
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={36} />
              </Box>
            ) : billableData ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Total Logged Hours
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                        {billableData.totalHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {billableData.totalTasks} total tasks logged
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Billable Hours
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main" sx={{ my: 1 }}>
                        {billableData.billableHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Billable Ratio: {billableData.billablePercentage?.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Approved Hours
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ my: 1 }}>
                        {billableData.approvedHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Verified by Senior/PM
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                        Pending Approvals
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ my: 1 }}>
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
                  <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
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
                            <Cell fill="#2563EB" />
                            <Cell fill="#94A3B8" />
                          </Pie>
                          <ChartTooltip
                            formatter={(v: number) => [`${v} hours`, 'Effort']}
                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 8, border: 'none', color: '#FFF', fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
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
                            <Cell fill="#10B981" />
                            <Cell fill="#F59E0B" />
                          </Pie>
                          <ChartTooltip
                            formatter={(v: number) => [`${v} hours`, 'Hours']}
                            contentStyle={{ backgroundColor: '#1E293B', borderRadius: 8, border: 'none', color: '#FFF', fontSize: 12 }}
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
