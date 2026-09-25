import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Slider,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useQuery, useMutation } from '@tanstack/react-query';
import { gradeRulesApi, SimulationResultDto } from '../api/gradeRulesApi';
import { criteriaApi } from '../../criteria/api/criteriaApi';
import { COLORS } from '../../../constants/colors';
import { ShimmerTableRows, ShimmerCardsLoader } from '../../../components/common/ShimmerLoader';

const GRADE_COLORS: Record<string, 'success' | 'primary' | 'secondary' | 'warning' | 'error' | 'default'> = {
  'A+': 'success',
  A: 'success',
  'A-': 'primary',
  'B+': 'primary',
  B: 'secondary',
  'B-': 'secondary',
  'C+': 'warning',
  C: 'warning',
  'C-': 'error',
};

export const GradeRulesPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  // Simulation inputs
  const [ratingsState, setRatingsState] = useState<{
    [criterionId: string]: { self: number; senior: number; pm: number };
  }>({});
  const [missedDeadlines, setMissedDeadlines] = useState(0);
  const [pmExceptionalContribution, setPmExceptionalContribution] = useState(false);
  const [selfSubmitted, setSelfSubmitted] = useState(true);
  const [simulationResult, setSimulationResult] = useState<SimulationResultDto | null>(null);

  const { data: rulesRes, isLoading: loadingRules } = useQuery({
    queryKey: ['grade-rules'],
    queryFn: () => gradeRulesApi.getGradeRules(),
  });

  const { data: criteriaRes, isLoading: loadingCriteria } = useQuery({
    queryKey: ['criteria'],
    queryFn: () => criteriaApi.getCriteria(),
  });

  const rules = rulesRes?.data || [];
  const criteria = criteriaRes?.data || [];

  // Initialize simulation criteria default ratings if empty
  React.useEffect(() => {
    if (criteria.length > 0 && Object.keys(ratingsState).length === 0) {
      const initial: Record<string, { self: number; senior: number; pm: number }> = {};
      criteria.forEach((c) => {
        initial[c._id] = { self: 4, senior: 4, pm: 4 };
      });
      setRatingsState(initial);
    }
  }, [criteria]);

  const simulateMutation = useMutation({
    mutationFn: gradeRulesApi.simulateGrade,
    onSuccess: (data) => {
      setSimulationResult(data.data);
    },
  });

  const handleRunSimulation = () => {
    const selfRatings = criteria.map((c) => ({
      criterionId: c._id,
      criterionName: c.name,
      weight: c.weight,
      score: ratingsState[c._id]?.self || 4,
    }));
    const seniorRatings = criteria.map((c) => ({
      criterionId: c._id,
      criterionName: c.name,
      weight: c.weight,
      score: ratingsState[c._id]?.senior || 4,
    }));
    const pmRatings = criteria.map((c) => ({
      criterionId: c._id,
      criterionName: c.name,
      weight: c.weight,
      score: ratingsState[c._id]?.pm || 4,
    }));

    simulateMutation.mutate({
      selfRatings: selfSubmitted ? selfRatings : undefined,
      seniorRatings,
      pmRatings,
      selfSubmitted,
      missedDeadlines,
      pmExceptionalContribution,
    });
  };

  const handleRatingChange = (criterionId: string, reviewer: 'self' | 'senior' | 'pm', val: number) => {
    setRatingsState((prev) => ({
      ...prev,
      [criterionId]: {
        ...(prev[criterionId] || { self: 3, senior: 3, pm: 3 }),
        [reviewer]: val,
      },
    }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" color="text.primary">
          Grade Rules & Calibration Engine
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure rule conditions (min/max scores, missed deadlines, special contributions) and simulate grade calculations.
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 3, border: `1px solid ${COLORS.neutral.borderLight}` }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<RuleOutlinedIcon />} iconPosition="start" label="Configured Grade Rules" />
          <Tab icon={<CalculateOutlinedIcon />} iconPosition="start" label="Interactive Grade Simulator" />
        </Tabs>

        {/* TAB 0: Grade Rules List */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: COLORS.neutral.bgHover }}>
                  <TableRow>
                    <TableCell sx={{ width: 90 }}>Priority</TableCell>
                    <TableCell sx={{ width: 100 }}>Grade</TableCell>
                    <TableCell sx={{ width: 150 }}>Score Range</TableCell>
                    <TableCell>Condition Requirements</TableCell>
                    <TableCell sx={{ width: 140 }}>HR Approval</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingRules ? (
                    <ShimmerTableRows rows={6} columns={5} hasAvatar={false} />
                  ) : (
                    rules.map((r, i) => (
                      <TableRow key={r._id || i} hover>
                        <TableCell>#{r.priority}</TableCell>
                        <TableCell>
                          <Chip
                            label={r.grade}
                            color={GRADE_COLORS[r.grade] || 'default'}
                            sx={{ fontSize: '0.95rem', minWidth: 50 }}
                          />
                        </TableCell>
                        <TableCell>
                          {r.minScore} - {r.maxScore}%
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.primary">
                            {r.description}
                          </Typography>
                          {r.conditions && r.conditions.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                              {r.conditions.map((cond, ci) => (
                                <Chip
                                  key={ci}
                                  label={`${cond.field} ${cond.operator} ${cond.value}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.75rem', backgroundColor: COLORS.neutral.bgHover }}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.requiresHrApproval ? (
                            <Chip label="Required" color="warning" size="small" variant="filled" />
                          ) : (
                            <Chip label="Auto" color="default" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: Interactive Simulator */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  1. Input Assessment Scores (1-5 Scale)
                </Typography>

                <Box sx={{ mb: 2.5, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selfSubmitted}
                        onChange={(e) => setSelfSubmitted(e.target.checked)}
                      />
                    }
                    label="Include Self Assessment (10% Weight)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pmExceptionalContribution}
                        onChange={(e) => setPmExceptionalContribution(e.target.checked)}
                      />
                    }
                    label="PM Exceptional Contribution"
                  />
                </Box>

                {loadingCriteria ? (
                  <ShimmerCardsLoader count={3} />
                ) : (
                  criteria.map((c) => (
                    <Card key={c._id} sx={{ mb: 2, border: `1px solid ${COLORS.neutral.borderLight}`, boxShadow: 'none' }}>
                      <CardHeader
                        title={c.name}
                        titleTypographyProps={{ variant: 'subtitle2'}}
                        subheader={`Weight: ${c.weight}%`}
                        sx={{ py: 1.5, px: 2, backgroundColor: COLORS.neutral.bgHover }}
                      />
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Grid container spacing={2}>
                          {selfSubmitted && (
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.secondary">
                                Self Rating: {ratingsState[c._id]?.self || 4} / 5
                              </Typography>
                              <Slider
                                value={ratingsState[c._id]?.self || 4}
                                min={1}
                                max={5}
                                step={1}
                                marks
                                onChange={(_, val) =>
                                  handleRatingChange(c._id, 'self', val as number)
                                }
                              />
                            </Grid>
                          )}
                          <Grid item xs={12} sm={selfSubmitted ? 4 : 6}>
                            <Typography variant="caption" color="primary.main">
                              Senior Rating: {ratingsState[c._id]?.senior || 4} / 5
                            </Typography>
                            <Slider
                              value={ratingsState[c._id]?.senior || 4}
                              min={1}
                              max={5}
                              step={1}
                              marks
                              color="primary"
                              onChange={(_, val) =>
                                handleRatingChange(c._id, 'senior', val as number)
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={selfSubmitted ? 4 : 6}>
                            <Typography variant="caption" color="secondary.main">
                              PM Rating: {ratingsState[c._id]?.pm || 4} / 5
                            </Typography>
                            <Slider
                              value={ratingsState[c._id]?.pm || 4}
                              min={1}
                              max={5}
                              step={1}
                              marks
                              color="secondary"
                              onChange={(_, val) =>
                                handleRatingChange(c._id, 'pm', val as number)
                              }
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))
                )}

                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Missed Deadlines Count: {missedDeadlines}
                  </Typography>
                  <Slider
                    value={missedDeadlines}
                    min={0}
                    max={5}
                    step={1}
                    marks
                    onChange={(_, val) => setMissedDeadlines(val as number)}
                    sx={{ maxWidth: 300 }}
                  />
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CalculateOutlinedIcon />}
                  onClick={handleRunSimulation}
                  disabled={simulateMutation.isPending}
                  sx={{ borderRadius: 2, px: 4, py: 1.2 }}
                >
                  {simulateMutation.isPending ? 'Simulating...' : 'Run Grade Engine Simulation'}
                </Button>
              </Grid>

              {/* Simulation Result Card */}
              <Grid item xs={12} lg={5}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  2. Engine Evaluation & Output
                </Typography>

                {simulationResult ? (
                  <Card sx={{ border: `2px solid ${COLORS.neutral.borderLight}`, borderRadius: 3, p: 2 }}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="overline" color="text.secondary">
                        Calculated Grade
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                        <Chip
                          label={simulationResult.grade}
                          color={GRADE_COLORS[simulationResult.grade] || 'primary'}
                          sx={{
                            fontSize: '2rem',
                            height: 64,
                            minWidth: 90,
                            borderRadius: 3,
                          }}
                        />
                      </Box>
                      <Typography variant="h5" color="text.primary">
                        Score: {simulationResult.finalScore.toFixed(2)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Rule Matched: {simulationResult.matchedRuleDescription}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Reviewer Contributions:
                    </Typography>
                    <Box sx={{ backgroundColor: COLORS.neutral.bgHover, p: 1.5, borderRadius: 2, mb: 2 }}>
                      {simulationResult.evaluationContext.selfScorePct !== undefined && (
                        <Typography variant="body2">
                          • Self (10%):{' '}
                          <strong>{simulationResult.evaluationContext.selfScorePct.toFixed(1)}%</strong>
                        </Typography>
                      )}
                      <Typography variant="body2">
                        • Senior ({simulationResult.evaluationContext.effectiveWeights.senior}%):{' '}
                        <strong>{simulationResult.evaluationContext.seniorScorePct.toFixed(1)}%</strong>
                      </Typography>
                      {simulationResult.evaluationContext.pmScorePct !== undefined && (
                        <Typography variant="body2">
                          • PM ({simulationResult.evaluationContext.effectiveWeights.pm}%):{' '}
                          <strong>{simulationResult.evaluationContext.pmScorePct.toFixed(1)}%</strong>
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Calibration & Anomaly Flags:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {simulationResult.flags.hasGapFlag ? (
                        <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />}>
                          <strong>Self vs Senior Gap &gt; 1.5:</strong> Flagged for calibration review.
                        </Alert>
                      ) : (
                        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                          No Self vs Senior score gap anomaly.
                        </Alert>
                      )}

                      {simulationResult.flags.hasDiscrepancyFlag ? (
                        <Alert severity="warning" icon={<WarningAmberIcon fontSize="inherit" />}>
                          <strong>Senior vs PM Discrepancy &ge; 2 grade steps:</strong> Needs calibration.
                        </Alert>
                      ) : (
                        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                          Senior and PM ratings are aligned.
                        </Alert>
                      )}

                      {simulationResult.flags.requiresHrApproval && (
                        <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />}>
                          <strong>HR Approval Required:</strong>{' '}
                          {simulationResult.flags.approvalReasons.join(', ')}
                        </Alert>
                      )}
                    </Box>
                  </Card>
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      borderRadius: 3,
                      border: `1px dashed ${COLORS.neutral.border}`,
                      backgroundColor: COLORS.neutral.bgHover,
                    }}
                  >
                    <CalculateOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      Adjust scores and parameters on the left and click "Run Grade Engine Simulation" to see live calculation details.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
