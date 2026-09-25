import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { PageHeader } from '../../../components/common/PageHeader';
import { useAuth } from '../../auth/context/AuthContext';
import { cyclesApi } from '../../cycles/api/cyclesApi';
import { reviewsApi } from '../../reviews/api/reviewsApi';
import { projectsApi, Project } from '../../projects/api/projectsApi';
import { reportsApi } from '../../reports/api/reportsApi';
import { useTranslation } from 'react-i18next';
import { COLORS, CHART_COLORS } from '../../../constants/colors';
import { ShimmerItem } from '../../../components/common/ShimmerLoader';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeChartTab, setActiveChartTab] = useState(0);

  const userRoles = user?.roles || [];
  const isSenior = userRoles.includes('SENIOR') || userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');
  const isPM = userRoles.includes('PM') || userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');
  const isHR = userRoles.includes('HR_ADMIN') || userRoles.includes('SUPER_ADMIN');

  const { data: cyclesRes } = useQuery({
    queryKey: ['cycles'],
    queryFn: () => cyclesApi.getCycles(),
  });

  const { data: myReviewsRes, isLoading: loadingReviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.getMyReviews(),
  });

  const { data: pendingReviewsRes } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: () => reviewsApi.getPendingReviews(),
    enabled: isSenior || isPM,
  });

  const { data: projectsRes, isLoading: loadingProjects } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectsApi.getProjects(),
  });

  const { data: summaryRes, isLoading: loadingSummary } = useQuery({
    queryKey: ['billable-summary-dashboard'],
    queryFn: () => reportsApi.getBillableSummary(),
  });

  const { data: projectEffortRes } = useQuery({
    queryKey: ['project-effort-dashboard'],
    queryFn: () => reportsApi.getProjectEffortReport(),
  });

  const { data: categoryBreakdownRes } = useQuery({
    queryKey: ['category-breakdown-dashboard'],
    queryFn: () => reportsApi.getCategoryBreakdown(),
  });

  const activeCycle = cyclesRes?.data?.find((c) => c.status === 'OPEN' || c.status === 'IN_REVIEW') || cyclesRes?.data?.[0];
  const myReviews = myReviewsRes?.data || [];
  const pendingReviews = pendingReviewsRes?.data || [];
  const myProjects: Project[] = projectsRes?.projects || [];
  const billableSummary = summaryRes?.data;
  const projectEffort = projectEffortRes?.data || [];
  const categoryBreakdown = categoryBreakdownRes?.data || [];

  const currentReview = myReviews[0];

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['cycles'] });
    queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    queryClient.invalidateQueries({ queryKey: ['billable-summary-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['project-effort-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['category-breakdown-dashboard'] });
  };

  // Format Project Effort Data for Bar Chart
  const effortChartData = projectEffort.slice(0, 6).map((item) => ({
    name: item.projectName?.length > 14 ? `${item.projectName.slice(0, 12)}...` : item.projectName || item.projectCode,
    fullName: item.projectName || item.projectCode,
    Billable: item.billableHours || 0,
    NonBillable: item.nonBillableHours || 0,
    Total: item.totalHours || 0,
  }));

  // Format Category Data for Pie Chart
  const categoryChartData = categoryBreakdown.map((item) => ({
    name: item._id || 'General',
    value: item.totalHours || 0,
    count: item.taskCount || 0,
  }));

  // Timesheet Billable vs Non-Billable Summary Split
  const billablePct = billableSummary?.billablePercentage ?? 0;
  const totalHours = billableSummary?.totalHours ?? 0;
  const billableHours = billableSummary?.billableHours ?? 0;
  const nonBillableHours = billableSummary?.nonBillableHours ?? 0;
  const approvedHours = billableSummary?.approvedHours ?? 0;
  const pendingHours = billableSummary?.pendingHours ?? 0;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Top Banner Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <PageHeader
          title={t('dashboard.welcome_user', { name: user?.fullName || t('dashboard.colleague_fallback') })}
          subtitle={t('dashboard.subtitle')}
        />
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
          <Tooltip title={t('dashboard.refresh_tooltip')}>
            <IconButton onClick={handleRefreshData} size="small" sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AssignmentOutlinedIcon />}
            onClick={() => navigate('/tasks/timesheet')}
            sx={{ px: 2, py: 0.8, borderRadius: 2 }}
          >
            {t('dashboard.log_timesheet')}
          </Button>
        </Stack>
      </Box>

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* KPI 1: Active Appraisal Cycle */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${COLORS.neutral.borderLight}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                  {t('dashboard.review_cycle')}
                </Typography>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(37, 99, 235, 0.1)', color: 'primary.main' }}>
                  <RateReviewOutlinedIcon fontSize="small" />
                </Avatar>
              </Stack>
              <Typography variant="h6" noWrap title={activeCycle ? activeCycle.name : t('dashboard.no_active_cycle')}>
                {activeCycle ? activeCycle.name : t('dashboard.no_active_cycle')}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.8 }}>
                <Chip
                  label={activeCycle?.status || 'PLANNED'}
                  size="small"
                  color={activeCycle?.status === 'OPEN' ? 'success' : 'primary'}
                  sx={{ height: 20, fontSize: '0.7rem'}}
                />
                <Typography variant="caption" color="text.secondary">
                  {activeCycle?.year ? `FY${activeCycle.year}` : 'Current Period'}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Logged Hours & Billability */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${COLORS.neutral.borderLight}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                  {t('timesheet.title')}
                </Typography>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'success.main' }}>
                  <AssignmentOutlinedIcon fontSize="small" />
                </Avatar>
              </Stack>
              <Typography variant="h5">
                {loadingSummary ? '...' : `${totalHours.toFixed(1)} hrs`}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('dashboard.billable_rate')}:
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {billablePct.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, billablePct))}
                  color="success"
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Projects & Assignments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${COLORS.neutral.borderLight}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                  {t('dashboard.assigned_projects')}
                </Typography>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(124, 58, 237, 0.1)', color: 'secondary.main' }}>
                  <FolderOutlinedIcon fontSize="small" />
                </Avatar>
              </Stack>
              <Typography variant="h5">
                {loadingProjects ? '...' : `${myProjects.length} ${t('projects.title')}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8 }}>
                {t('dashboard.client_internal_split', {
                  client: myProjects.filter((p) => p.type === 'CLIENT').length,
                  internal: myProjects.filter((p) => p.type === 'INTERNAL').length,
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Latest Appraisal Rating */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${COLORS.neutral.borderLight}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.05em">
                  {t('reviews.final_grade')}
                </Typography>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main' }}>
                  <TrendingUpOutlinedIcon fontSize="small" />
                </Avatar>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h5" color="primary.main">
                  {myReviews.find((r) => r.calculatedGrade)?.calculatedGrade || t('dashboard.pending')}
                </Typography>
                {currentReview?.finalScore && (
                  <Typography variant="caption" color="text.secondary">
                    ({currentReview.finalScore.toFixed(2)}/5.0)
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8 }}>
                {currentReview ? `Status: ${currentReview.status.replace('_', ' ')}` : 'No reviews active'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Chart Row */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Main Interactive Chart (Effort & Categories) */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  {t('dashboard.project_effort_breakdown')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('dashboard.category_effort_distribution')}
                </Typography>
              </Box>
              <Tabs
                value={activeChartTab}
                onChange={(_, v) => setActiveChartTab(v)}
                sx={{
                  minHeight: 36,
                  '& .MuiTab-root': { minHeight: 36, py: 0.5, px: 1.5, fontSize: '0.8rem'},
                }}
              >
                <Tab icon={<BarChartOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('projects.title')} />
                <Tab icon={<PieChartOutlineOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('tasks.category')} />
              </Tabs>
            </Box>

            {/* Tab 0: Project Effort Chart */}
            {activeChartTab === 0 && (
              <Box sx={{ width: '100%', height: 280, mt: 1 }}>
                {effortChartData.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <HourglassEmptyOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('empty_states.no_tasks')}
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={effortChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.neutral.bgMuted} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.neutral.textSlate }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: COLORS.neutral.textSlate }} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: COLORS.neutral.darkCard,
                          borderRadius: 8,
                          border: 'none',
                          color: COLORS.neutral.textWhite,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar dataKey="Billable" stackId="a" fill={COLORS.accent.blueRoyal} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="NonBillable" stackId="a" fill={COLORS.neutral.textMuted} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            )}

            {/* Tab 1: Category Breakdown Chart */}
            {activeChartTab === 1 && (
              <Box sx={{ width: '100%', height: 280, mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categoryChartData.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <HourglassEmptyOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('empty_states.no_tasks')}
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(val: number) => [`${val} hours`, 'Effort']}
                        contentStyle={{
                          backgroundColor: COLORS.neutral.darkCard,
                          borderRadius: 8,
                          border: 'none',
                          color: COLORS.neutral.textWhite,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Timesheet Compliance & Approval Health */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.hours_breakdown')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2.5 }}>
                {t('dashboard.category_effort_distribution')}
              </Typography>

              {/* Progress Breakdown */}
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2">
                      {t('dashboard.approved')} {t('dashboard.total_hours')}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {approvedHours.toFixed(1)} hrs ({totalHours > 0 ? ((approvedHours / totalHours) * 100).toFixed(0) : 0}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={totalHours > 0 ? (approvedHours / totalHours) * 100 : 0}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2">
                      {t('dashboard.pending')} {t('common.status')}
                    </Typography>
                    <Typography variant="caption" color="warning.main">
                      {pendingHours.toFixed(1)} hrs ({totalHours > 0 ? ((pendingHours / totalHours) * 100).toFixed(0) : 0}%)
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={totalHours > 0 ? (pendingHours / totalHours) * 100 : 0}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: COLORS.neutral.bgHover, borderRadius: 2, border: `1px solid ${COLORS.neutral.borderLight}`, mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.total_hours')}
                      </Typography>
                      <Typography variant="h6">
                        {billableSummary?.totalTasks ?? 0}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('dashboard.billable')} / {t('dashboard.non_billable')}
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {billableHours.toFixed(1)}h / {nonBillableHours.toFixed(1)}h
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<AssessmentOutlinedIcon />}
              onClick={() => navigate('/reports')}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {t('dashboard.view_full_report')}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Action & Review Section */}
      <Grid container spacing={3}>
        {/* Left Column: Active Performance Review & Quick Actions */}
        <Grid item xs={12} md={7}>
          {/* Active Performance Review Card */}
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, mb: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.my_reviews')}
            </Typography>
            {loadingReviews ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 2 }}>
                <ShimmerItem width="40%" height={22} />
                <ShimmerItem width="85%" height={16} />
                <ShimmerItem width="60%" height={16} />
              </Box>
            ) : currentReview ? (
              <Box sx={{ mt: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1">
                      {currentReview.cycleId?.name || t('reviews.cycle')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {currentReview._id?.slice(-6).toUpperCase()}
                    </Typography>
                  </Box>
                  <Chip
                    label={currentReview.status.replace('_', ' ')}
                    color={
                      currentReview.status === 'PUBLISHED' || currentReview.status === 'ACKNOWLEDGED'
                        ? 'success'
                        : currentReview.status === 'SELF_PENDING'
                        ? 'warning'
                        : 'primary'
                    }
                    size="small"
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: COLORS.neutral.bgHover, borderRadius: 2, border: `1px solid ${COLORS.neutral.borderLight}`, mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('employees.manager')}
                      </Typography>
                      <Typography variant="body2">
                        {currentReview.seniorId
                          ? `${currentReview.seniorId.firstName} ${currentReview.seniorId.lastName}`
                          : t('employees.manager')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('reviews.final_grade')}
                      </Typography>
                      <Typography variant="body2" color="primary.main">
                        {currentReview.calculatedGrade || t('dashboard.pending')}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(`/reviews/${currentReview._id}`)}
                  sx={{ borderRadius: 2, px: 2.5 }}
                >
                  {currentReview.status === 'SELF_PENDING'
                    ? t('reviews.submit_appraisal')
                    : currentReview.status === 'PUBLISHED'
                    ? t('dashboard.view_my_review')
                    : t('dashboard.view_my_review')}
                </Button>
              </Box>
            ) : (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <RateReviewOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('empty_states.no_reviews')}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Quick Action Navigation Grid */}
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
            <Typography variant="h6" gutterBottom>
              {t('nav.management_approvals')}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentOutlinedIcon />}
                  onClick={() => navigate('/tasks/timesheet')}
                  sx={{ py: 1.3, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
                >
                  {t('nav.weekly_timesheet')}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RateReviewOutlinedIcon />}
                  onClick={() => navigate('/reviews')}
                  sx={{ py: 1.3, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
                >
                  {t('nav.my_reviews')}
                </Button>
              </Grid>
              {(isSenior || isPM) && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="warning"
                      startIcon={<PendingActionsIcon />}
                      onClick={() => navigate('/tasks/approvals')}
                      sx={{ py: 1.3, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
                    >
                      {t('nav.task_approvals')}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<RateReviewOutlinedIcon />}
                      onClick={() => navigate('/reviews/team')}
                      sx={{ py: 1.3, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
                    >
                      {t('nav.team_reviews')} ({pendingReviews.length})
                    </Button>
                  </Grid>
                </>
              )}
              {isHR && (
                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => navigate('/reviews/calibration')}
                    sx={{ py: 1.3, borderRadius: 2, justifyContent: 'flex-start', px: 2 }}
                  >
                    {t('nav.calibration')}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column: Manager Pending Queue & Assigned Projects */}
        <Grid item xs={12} md={5}>
          {/* Manager Action Queue */}
          {(isSenior || isPM) && pendingReviews.length > 0 && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${COLORS.feedback.warningBorder}`,
                backgroundColor: COLORS.feedback.warningBg,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" color="warning.dark">
                  {t('dashboard.pending_reviews_action')} ({pendingReviews.length})
                </Typography>
                <Chip label={t('dashboard.requires_scoring')} color="warning" size="small" sx={{ height: 22 }} />
              </Stack>
              <List disablePadding>
                {pendingReviews.slice(0, 3).map((r) => (
                  <ListItem
                    key={r._id}
                    disableGutters
                    sx={{ py: 1, borderBottom: '1px solid rgba(245, 158, 11, 0.2)' }}
                    secondaryAction={
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => navigate(`/reviews/${r._id}`)}
                        sx={{ fontSize: '0.75rem', px: 1.5, borderRadius: 1.5 }}
                      >
                        {t('common.edit')}
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={`${r.employeeId?.firstName} ${r.employeeId?.lastName}`}
                      secondary={`${r.employeeId?.designation} • ${r.status.replace('_', ' ')}`}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Assigned Projects List */}
          <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {t('projects.title')} ({myProjects.length})
              </Typography>
              <Button size="small" onClick={() => navigate('/projects')}>
                {t('navbar.view_all')}
              </Button>
            </Box>
            {myProjects.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                {t('empty_states.no_projects')}
              </Typography>
            ) : (
              <List disablePadding>
                {myProjects.slice(0, 5).map((p) => (
                  <ListItem
                    key={p._id}
                    disableGutters
                    sx={{ py: 1.2, borderBottom: `1px solid ${COLORS.neutral.bgMuted}` }}
                    secondaryAction={
                      <Chip
                        label={p.type}
                        size="small"
                        color={p.type === 'CLIENT' ? 'primary' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderOutlinedIcon color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={p.name}
                      secondary={p.projectCode}
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                      secondaryTypographyProps={{ fontSize: '0.72rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
