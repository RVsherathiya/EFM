import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Slider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviewsApi';

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});
  const [achievements, setAchievements] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasOfImprovement, setAreasOfImprovement] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [seniorJustification, setSeniorJustification] = useState('');
  const [pmExceptionalContribution, setPmExceptionalContribution] = useState(false);
  const [pmExceptionalDetails, setPmExceptionalDetails] = useState('');
  const [validationError, setValidationError] = useState('');

  // Dialog states
  const [sendBackDialogOpen, setSendBackDialogOpen] = useState(false);
  const [sendBackReason, setSendBackReason] = useState('');
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [acknowledgeComments, setAcknowledgeComments] = useState('');
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);

  const { data: detailRes, isLoading } = useQuery({
    queryKey: ['review-detail', id],
    queryFn: () => reviewsApi.getReviewDetail(id!),
    enabled: !!id,
  });

  const detail = detailRes?.data;
  const review = detail?.review;
  const criteria = detail?.criteria || [];
  const existingRatings = detail?.ratings || [];
  const existingFeedback = detail?.feedback || [];
  const metrics = detail?.metrics;
  const permissions = detail?.permissions;

  // Initialize state from existing ratings/feedback
  useEffect(() => {
    if (detail) {
      const rMap: Record<string, { score: number; comment: string }> = {};

      let currentReviewerType: 'SELF' | 'SENIOR' | 'PM' = 'SELF';
      if (permissions?.canSubmitSenior) currentReviewerType = 'SENIOR';
      else if (permissions?.canSubmitPM) currentReviewerType = 'PM';

      criteria.forEach((c) => {
        const found = existingRatings.find(
          (r) => r.criterionId === c._id && r.reviewerType === currentReviewerType
        );
        rMap[c._id] = {
          score: found?.score || 3,
          comment: found?.comment || '',
        };
      });
      setRatings(rMap);

      const fb = existingFeedback.find((f) => f.reviewerType === currentReviewerType);
      if (fb) {
        setAchievements(fb.achievements || '');
        setStrengths(fb.strengths || '');
        setAreasOfImprovement(fb.areasOfImprovement || '');
        setActionItems(fb.actionItems || '');
        setSeniorJustification(fb.seniorJustification || '');
        setPmExceptionalContribution(!!fb.pmExceptionalContribution);
        setPmExceptionalDetails(fb.pmExceptionalContributionDetails || '');
      }
    }
  }, [detail]);

  const submitSelfMutation = useMutation({
    mutationFn: (isDraft: boolean) =>
      reviewsApi.submitSelf(id!, {
        ratings: criteria.map((c) => ({
          criterionId: c._id,
          score: ratings[c._id]?.score || 3,
          comment: ratings[c._id]?.comment || '',
        })),
        achievements,
        strengths,
        areasOfImprovement,
        actionItems,
        isDraft,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setValidationError('');
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.error?.message || 'Failed to submit review');
    },
  });

  const submitSeniorMutation = useMutation({
    mutationFn: (isDraft: boolean) =>
      reviewsApi.submitSenior(id!, {
        ratings: criteria.map((c) => ({
          criterionId: c._id,
          score: ratings[c._id]?.score || 3,
          comment: ratings[c._id]?.comment || '',
        })),
        strengths,
        areasOfImprovement,
        actionItems,
        seniorJustification,
        isDraft,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setValidationError('');
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.error?.message || 'Failed to submit senior review');
    },
  });

  const submitPMMutation = useMutation({
    mutationFn: (isDraft: boolean) =>
      reviewsApi.submitPM(id!, {
        ratings: criteria.map((c) => ({
          criterionId: c._id,
          score: ratings[c._id]?.score || 3,
          comment: ratings[c._id]?.comment || '',
        })),
        pmExceptionalContribution,
        pmExceptionalContributionDetails: pmExceptionalDetails,
        feedback: achievements,
        isDraft,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setValidationError('');
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.error?.message || 'Failed to submit PM review');
    },
  });

  const sendBackMutation = useMutation({
    mutationFn: () => reviewsApi.sendBack(id!, sendBackReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setSendBackDialogOpen(false);
      setSendBackReason('');
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => reviewsApi.acknowledgeReview(id!, acknowledgeComments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setAcknowledgeDialogOpen(false);
    },
  });

  const disputeMutation = useMutation({
    mutationFn: () => reviewsApi.disputeReview(id!, disputeReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-detail', id] });
      setDisputeDialogOpen(false);
    },
  });

  const validateScores = (): boolean => {
    // BR-REVIEW-004: Score 1, 2, 5 requires mandatory comment
    for (const c of criteria) {
      const item = ratings[c._id];
      if (item && (item.score === 1 || item.score === 2 || item.score === 5)) {
        if (!item.comment || item.comment.trim().length < 5) {
          setValidationError(
            `Mandatory justification required for "${c.name}" because a rating of ${item.score} was given.`
          );
          return false;
        }
      }
    }
    setValidationError('');
    return true;
  };

  const handleScoreChange = (criterionId: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [criterionId]: {
        score,
        comment: prev[criterionId]?.comment || '',
      },
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    setRatings((prev) => ({
      ...prev,
      [criterionId]: {
        score: prev[criterionId]?.score || 3,
        comment,
      },
    }));
  };

  if (isLoading || !review) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isPublished = review.status === 'PUBLISHED' || review.status === 'ACKNOWLEDGED';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Back to Reviews
      </Button>

      {/* Header Card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h4" fontWeight={700}>
                {review.employeeId?.firstName} {review.employeeId?.lastName}
              </Typography>
              <Chip
                label={review.status.replace('_', ' ')}
                color="primary"
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
              {review.isDisputed && <Chip label="Disputed" color="error" sx={{ fontWeight: 700 }} />}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {review.employeeId?.designation} • {review.employeeId?.employeeCode} • Cycle:{' '}
              <strong>{review.cycleId?.name}</strong>
            </Typography>
          </Grid>

          {isPublished && (
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Final Published Grade
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { md: 'flex-end' }, gap: 1.5 }}>
                <Chip
                  label={review.calculatedGrade}
                  color="success"
                  sx={{ fontSize: '1.5rem', height: 44, fontWeight: 900, px: 1 }}
                />
                <Typography variant="h6" fontWeight={700} color="text.secondary">
                  ({review.finalScore?.toFixed(2)}%)
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Task & Performance Metrics Snapshot Panel */}
      {metrics && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
            <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} /> Task & Effort
            Snapshot for Cycle Period
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Total Logged Hours
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {metrics.totalLoggedHours}h
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Billable Hours (%):
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                {metrics.billableHours}h ({metrics.billablePercentage?.toFixed(1)}%)
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Tasks Completed
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {metrics.tasksCompleted}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">
                Missed Deadlines
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={metrics.missedDeadlines > 0 ? 'error.main' : 'success.main'}
              >
                {metrics.missedDeadlines}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {validationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {validationError}
        </Alert>
      )}

      {/* Criteria Evaluation Cards */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Assessment Criteria Evaluation
      </Typography>

      {criteria.map((c) => {
        const selfRating = existingRatings.find((r) => r.criterionId === c._id && r.reviewerType === 'SELF');
        const seniorRating = existingRatings.find((r) => r.criterionId === c._id && r.reviewerType === 'SENIOR');
        const pmRating = existingRatings.find((r) => r.criterionId === c._id && r.reviewerType === 'PM');

        const currentVal = ratings[c._id]?.score || 3;
        const currentComment = ratings[c._id]?.comment || '';

        return (
          <Card key={c._id} sx={{ mb: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {c.name}
                  </Typography>
                  <Chip label={`Weight: ${c.weight}%`} size="small" variant="outlined" />
                </Box>
              }
              subheader={c.description}
              sx={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
            />
            <CardContent sx={{ p: 3 }}>
              {/* If Senior or PM or Published, show comparative history */}
              {(permissions?.canSubmitSenior || permissions?.canSubmitPM || isPublished) && (
                <Grid container spacing={2} sx={{ mb: 2.5, p: 1.5, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
                  {selfRating && (
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Self Score:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selfRating.score} / 5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        "{selfRating.comment || 'No comment'}"
                      </Typography>
                    </Grid>
                  )}
                  {seniorRating && (permissions?.canSubmitPM || isPublished) && (
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        Senior Score:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {seniorRating.score} / 5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        "{seniorRating.comment || 'No comment'}"
                      </Typography>
                    </Grid>
                  )}
                  {pmRating && isPublished && (
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="secondary.main" fontWeight={700}>
                        PM Score:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="secondary.main">
                        {pmRating.score} / 5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        "{pmRating.comment || 'No comment'}"
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Active reviewer score input */}
              {(permissions?.canSubmitSelf || permissions?.canSubmitSenior || permissions?.canSubmitPM) && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Your Score (1 to 5): {currentVal} / 5
                  </Typography>
                  <Slider
                    value={currentVal}
                    min={1}
                    max={5}
                    step={1}
                    marks={[
                      { value: 1, label: '1 - Below' },
                      { value: 2, label: '2 - Partially' },
                      { value: 3, label: '3 - Meets' },
                      { value: 4, label: '4 - Exceeds' },
                      { value: 5, label: '5 - Outstanding' },
                    ]}
                    onChange={(_, val) => handleScoreChange(c._id, val as number)}
                    sx={{ maxWidth: 600, mb: 2 }}
                  />
                  <TextField
                    label={
                      currentVal === 1 || currentVal === 2 || currentVal === 5
                        ? 'Mandatory Justification Comment *'
                        : 'Comments / Examples'
                    }
                    fullWidth
                    multiline
                    rows={2}
                    value={currentComment}
                    onChange={(e) => handleCommentChange(c._id, e.target.value)}
                    required={currentVal === 1 || currentVal === 2 || currentVal === 5}
                    placeholder="Provide specific concrete observations and feedback..."
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Additional Feedback & Goals Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #E2E8F0' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Achievements, Growth & Action Items
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Key Achievements & Strengths"
              fullWidth
              multiline
              rows={3}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              disabled={!permissions?.canSubmitSelf && !permissions?.canSubmitSenior}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Areas for Improvement & Action Items"
              fullWidth
              multiline
              rows={3}
              value={areasOfImprovement}
              onChange={(e) => setAreasOfImprovement(e.target.value)}
              disabled={!permissions?.canSubmitSelf && !permissions?.canSubmitSenior}
            />
          </Grid>
        </Grid>

        {permissions?.canSubmitPM && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pmExceptionalContribution}
                  onChange={(e) => setPmExceptionalContribution(e.target.checked)}
                />
              }
              label={<strong>PM Exceptional Contribution (Required for A+ grade)</strong>}
            />
            {pmExceptionalContribution && (
              <TextField
                label="Exceptional Contribution Details *"
                fullWidth
                multiline
                rows={2}
                sx={{ mt: 1 }}
                value={pmExceptionalDetails}
                onChange={(e) => setPmExceptionalDetails(e.target.value)}
                placeholder="Explain the extraordinary impact or benchmark delivery..."
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Action Footer Bar */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end', mt: 3 }}>
        {permissions?.canSubmitSelf && (
          <>
            <Button
              variant="outlined"
              startIcon={<SaveOutlinedIcon />}
              onClick={() => submitSelfMutation.mutate(true)}
              disabled={submitSelfMutation.isPending}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                if (validateScores()) submitSelfMutation.mutate(false);
              }}
              disabled={submitSelfMutation.isPending}
            >
              Submit Self Assessment
            </Button>
          </>
        )}

        {permissions?.canSubmitSenior && (
          <>
            <Button
              variant="outlined"
              startIcon={<SaveOutlinedIcon />}
              onClick={() => submitSeniorMutation.mutate(true)}
              disabled={submitSeniorMutation.isPending}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                if (validateScores()) submitSeniorMutation.mutate(false);
              }}
              disabled={submitSeniorMutation.isPending}
            >
              Submit Senior Rating
            </Button>
          </>
        )}

        {permissions?.canSubmitPM && (
          <>
            {permissions?.canSendBack && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<ReplyOutlinedIcon />}
                onClick={() => setSendBackDialogOpen(true)}
              >
                Send Back to Senior ({1 - review.pmSendBackCount} left)
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => {
                if (validateScores()) submitPMMutation.mutate(false);
              }}
              disabled={submitPMMutation.isPending}
            >
              Submit PM Evaluation
            </Button>
          </>
        )}

        {permissions?.canAcknowledge && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ThumbUpAltOutlinedIcon />}
            onClick={() => setAcknowledgeDialogOpen(true)}
          >
            Acknowledge Grade
          </Button>
        )}

        {permissions?.canDispute && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ReportProblemOutlinedIcon />}
            onClick={() => setDisputeDialogOpen(true)}
          >
            Raise Review Dispute
          </Button>
        )}
      </Box>

      {/* Send Back Dialog */}
      <Dialog open={sendBackDialogOpen} onClose={() => setSendBackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Send Back Review to Senior Manager</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can send back this review to the Senior Manager for re-evaluation (Max 1 time). Please provide clear rationale.
          </Typography>
          <TextField
            label="Send Back Rationale *"
            fullWidth
            multiline
            rows={3}
            value={sendBackReason}
            onChange={(e) => setSendBackReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setSendBackDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={!sendBackReason.trim() || sendBackMutation.isPending}
            onClick={() => sendBackMutation.mutate()}
          >
            Confirm Send Back
          </Button>
        </DialogActions>
      </Dialog>

      {/* Acknowledge Dialog */}
      <Dialog open={acknowledgeDialogOpen} onClose={() => setAcknowledgeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Acknowledge Performance Appraisal</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            I confirm that I have reviewed my appraisal ratings and final grade for {review.cycleId?.name}.
          </Typography>
          <TextField
            label="Employee Response / Comments (Optional)"
            fullWidth
            multiline
            rows={2}
            value={acknowledgeComments}
            onChange={(e) => setAcknowledgeComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAcknowledgeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => acknowledgeMutation.mutate()}
            disabled={acknowledgeMutation.isPending}
          >
            Acknowledge & Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onClose={() => setDisputeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Raise Review Dispute</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            If you disagree with the final assessment, you can raise an official review dispute for HR Admin mediation.
          </Typography>
          <TextField
            label="Dispute Justification & Specific Points *"
            fullWidth
            multiline
            rows={4}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDisputeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!disputeReason.trim() || disputeMutation.isPending}
            onClick={() => disputeMutation.mutate()}
          >
            Submit Dispute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
