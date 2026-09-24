import { Types } from 'mongoose';
import { Review, IReview } from '../../models/Review.model.js';
import { ReviewRating } from '../../models/ReviewRating.model.js';
import { ReviewFeedback } from '../../models/ReviewFeedback.model.js';
import { ReviewMetric } from '../../models/ReviewMetric.model.js';
import { Override } from '../../models/Override.model.js';
import { Task } from '../../models/Task.model.js';
import { Criterion } from '../../models/Criterion.model.js';
import { IUser } from '../../models/User.model.js';
import { gradeEngine } from '../grade-engine/grade.engine.js';
import { auditService } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { REVIEW_STATUS, TASK_STATUS } from '../../config/constants.js';

export interface SubmitRatingDto {
  criterionId: string;
  score: number; // 1 to 5
  comment?: string;
}

export interface SubmitSelfReviewDto {
  ratings: SubmitRatingDto[];
  achievements?: string;
  strengths?: string;
  areasOfImprovement?: string;
  actionItems?: string;
  isDraft?: boolean;
}

export interface SubmitSeniorReviewDto {
  ratings: SubmitRatingDto[];
  strengths?: string;
  areasOfImprovement?: string;
  actionItems?: string;
  seniorJustification?: string;
  isDraft?: boolean;
}

export interface SubmitPMReviewDto {
  ratings: SubmitRatingDto[];
  pmExceptionalContribution?: boolean;
  pmExceptionalContributionDetails?: string;
  feedback?: string;
  isDraft?: boolean;
}

export class ReviewWorkflowService {
  /**
   * Validates mandatory comments on extreme scores (1, 2, 5) per BR-REVIEW-004
   */
  private validateRatingComments(ratings: SubmitRatingDto[]) {
    for (const r of ratings) {
      if ((r.score === 1 || r.score === 2 || r.score === 5) && (!r.comment || !r.comment.trim())) {
        throw AppError.badRequest(
          `Scores of 1, 2, or 5 require a mandatory comment for justification (BR-REVIEW-004).`
        );
      }
    }
  }

  /**
   * Computes snapshot task metrics for the employee review period (BR-TASK-006)
   */
  public async computeReviewMetrics(reviewId: Types.ObjectId, employeeId: Types.ObjectId, periodStart: Date, periodEnd: Date) {
    const tasks = await Task.find({
      userId: employeeId,
      workDate: { $gte: periodStart, $lte: periodEnd },
      isDeleted: false,
    }).populate('projectId');

    let totalLoggedHours = 0;
    let totalApprovedHours = 0;
    let billableHours = 0;
    let missedDeadlines = 0;
    let tasksCompleted = 0;
    const hoursByCategory: Record<string, number> = {};
    const projectHoursMap = new Map<string, { projectName: string; hours: number }>();

    for (const t of tasks) {
      totalLoggedHours += t.hours;
      if (t.status === TASK_STATUS.APPROVED) {
        totalApprovedHours += t.hours;
        if (t.billable) {
          billableHours += t.hours;
        }
      }
      if (t.status === TASK_STATUS.APPROVED || t.status === TASK_STATUS.SUBMITTED) {
        tasksCompleted++;
      }
      if (t.dueDate && t.updatedAt && new Date(t.updatedAt) > new Date(t.dueDate)) {
        missedDeadlines++;
      }

      hoursByCategory[t.category] = (hoursByCategory[t.category] || 0) + t.hours;

      const pId = (t.projectId as any)?._id?.toString() || t.projectId.toString();
      const pName = (t.projectId as any)?.name || 'Project';
      const existing = projectHoursMap.get(pId) || { projectName: pName, hours: 0 };
      existing.hours += t.hours;
      projectHoursMap.set(pId, existing);
    }

    const billablePercentage = totalApprovedHours > 0
      ? Math.round((billableHours / totalApprovedHours) * 100 * 100) / 100
      : 0;

    const hoursByProject = Array.from(projectHoursMap.entries()).map(([projectId, val]) => ({
      projectId: new Types.ObjectId(projectId),
      projectName: val.projectName,
      hours: Math.round(val.hours * 100) / 100,
    }));

    return ReviewMetric.findOneAndUpdate(
      { reviewId },
      {
        reviewId,
        totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
        totalApprovedHours: Math.round(totalApprovedHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        billablePercentage,
        tasksCompleted,
        missedDeadlines,
        hoursByCategory,
        hoursByProject,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Employee Self-Review submission
   */
  public async submitSelfReview(reviewId: string, input: SubmitSelfReviewDto, currentUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    if (!review.employeeId.equals(currentUser._id)) {
      throw AppError.forbidden('You can only submit your own self-review (BR-REVIEW-001).');
    }

    if (review.status !== REVIEW_STATUS.DRAFT && review.status !== REVIEW_STATUS.SELF_PENDING) {
      throw AppError.badRequest(`Self review cannot be edited in current state: ${review.status}.`);
    }

    if (!input.isDraft) {
      this.validateRatingComments(input.ratings);
    }

    // Save ratings
    for (const r of input.ratings) {
      await ReviewRating.findOneAndUpdate(
        { reviewId: review._id, criterionId: new Types.ObjectId(r.criterionId), reviewerType: 'SELF' },
        {
          reviewId: review._id,
          criterionId: new Types.ObjectId(r.criterionId),
          reviewerType: 'SELF',
          reviewerId: currentUser._id,
          score: r.score,
          comment: r.comment || '',
        },
        { upsert: true, new: true }
      );
    }

    // Save feedback
    await ReviewFeedback.findOneAndUpdate(
      { reviewId: review._id, reviewerType: 'SELF' },
      {
        reviewId: review._id,
        reviewerType: 'SELF',
        reviewerId: currentUser._id,
        achievements: input.achievements,
        strengths: input.strengths,
        areasOfImprovement: input.areasOfImprovement,
        actionItems: input.actionItems,
      },
      { upsert: true, new: true }
    );

    if (!input.isDraft) {
      review.status = REVIEW_STATUS.SELF_SUBMITTED;
      review.selfSubmittedAt = new Date();
      await review.save();

      await auditService.log({
        entity: 'REVIEW',
        entityId: review._id.toString(),
        action: 'SELF_REVIEW_SUBMITTED',
        userId: currentUser._id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userEmail: currentUser.email,
      });
    }

    return review;
  }

  /**
   * Senior Reviewer submission
   */
  public async submitSeniorReview(reviewId: string, input: SubmitSeniorReviewDto, currentUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    const isSeniorAssigned = review.seniorId.equals(currentUser._id);
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');

    if (!isSeniorAssigned && !isHR) {
      throw AppError.forbidden('You are not the designated Senior Reviewer for this employee (BR-REVIEW-001).');
    }

    const allowedStatuses = [REVIEW_STATUS.SELF_SUBMITTED, REVIEW_STATUS.SENIOR_PENDING];
    if (!allowedStatuses.includes(review.status as any)) {
      throw AppError.badRequest(`Senior review cannot be submitted in current state: ${review.status}.`);
    }

    if (!input.isDraft) {
      this.validateRatingComments(input.ratings);
    }

    for (const r of input.ratings) {
      await ReviewRating.findOneAndUpdate(
        { reviewId: review._id, criterionId: new Types.ObjectId(r.criterionId), reviewerType: 'SENIOR' },
        {
          reviewId: review._id,
          criterionId: new Types.ObjectId(r.criterionId),
          reviewerType: 'SENIOR',
          reviewerId: currentUser._id,
          score: r.score,
          comment: r.comment || '',
        },
        { upsert: true, new: true }
      );
    }

    await ReviewFeedback.findOneAndUpdate(
      { reviewId: review._id, reviewerType: 'SENIOR' },
      {
        reviewId: review._id,
        reviewerType: 'SENIOR',
        reviewerId: currentUser._id,
        strengths: input.strengths,
        areasOfImprovement: input.areasOfImprovement,
        actionItems: input.actionItems,
        seniorJustification: input.seniorJustification,
      },
      { upsert: true, new: true }
    );

    if (!input.isDraft) {
      review.status = REVIEW_STATUS.SENIOR_SUBMITTED;
      review.seniorSubmittedAt = new Date();
      await review.save();

      await auditService.log({
        entity: 'REVIEW',
        entityId: review._id.toString(),
        action: 'SENIOR_REVIEW_SUBMITTED',
        userId: currentUser._id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userEmail: currentUser.email,
      });
    }

    return review;
  }

  /**
   * PM Reviewer Send-Back to Senior (allowed max 1 time per BR-REVIEW-002)
   */
  public async sendBackToSenior(reviewId: string, reason: string, currentUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    const isPM = review.pmId ? review.pmId.equals(currentUser._id) : false;
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');

    if (!isPM && !isHR) {
      throw AppError.forbidden('Only the assigned Project Manager or HR can send a review back (BR-REVIEW-002).');
    }

    const allowedStatuses = [REVIEW_STATUS.SENIOR_SUBMITTED, REVIEW_STATUS.PM_PENDING];
    if (!allowedStatuses.includes(review.status as any)) {
      throw AppError.badRequest(`Review cannot be sent back from current state: ${review.status}.`);
    }

    if (review.pmSendBackCount >= 1) {
      throw AppError.badRequest('Review has already been sent back once. Maximum send-back limit reached (BR-REVIEW-002).');
    }

    if (!reason || !reason.trim()) {
      throw AppError.badRequest('A mandatory reason is required when sending back to Senior reviewer.');
    }

    review.status = REVIEW_STATUS.SENIOR_PENDING;
    review.pmSendBackCount += 1;
    review.pmSendBackReason = reason;
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'REVIEW_SENT_BACK_TO_SENIOR',
      userId: currentUser._id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userEmail: currentUser.email,
      newValue: { reason, sendBackCount: review.pmSendBackCount },
    });

    return review;
  }

  /**
   * PM Reviewer submission & triggers automatic grade calculation (BR-REVIEW-001 & BR-GRADE)
   */
  public async submitPMReview(reviewId: string, input: SubmitPMReviewDto, currentUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    const isPM = review.pmId ? review.pmId.equals(currentUser._id) : false;
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');

    if (!isPM && !isHR) {
      throw AppError.forbidden('You are not the designated Project Manager for this review (BR-REVIEW-001).');
    }

    const allowedStatuses = [REVIEW_STATUS.SENIOR_SUBMITTED, REVIEW_STATUS.PM_PENDING];
    if (!allowedStatuses.includes(review.status as any)) {
      throw AppError.badRequest(`PM review cannot be submitted in current state: ${review.status}.`);
    }

    if (!input.isDraft) {
      this.validateRatingComments(input.ratings);
    }

    for (const r of input.ratings) {
      await ReviewRating.findOneAndUpdate(
        { reviewId: review._id, criterionId: new Types.ObjectId(r.criterionId), reviewerType: 'PM' },
        {
          reviewId: review._id,
          criterionId: new Types.ObjectId(r.criterionId),
          reviewerType: 'PM',
          reviewerId: currentUser._id,
          score: r.score,
          comment: r.comment || '',
        },
        { upsert: true, new: true }
      );
    }

    await ReviewFeedback.findOneAndUpdate(
      { reviewId: review._id, reviewerType: 'PM' },
      {
        reviewId: review._id,
        reviewerType: 'PM',
        reviewerId: currentUser._id,
        pmExceptionalContribution: input.pmExceptionalContribution,
        pmExceptionalContributionDetails: input.pmExceptionalContributionDetails,
        areasOfImprovement: input.feedback,
      },
      { upsert: true, new: true }
    );

    if (!input.isDraft) {
      review.status = REVIEW_STATUS.PM_SUBMITTED;
      review.pmSubmittedAt = new Date();
      await review.save();

      // Automatically Calculate Final Grade
      await this.calculateGrade(review._id.toString(), currentUser);
    }

    return review;
  }

  /**
   * Executes domain GradeEngine to compute grade, evaluation context, and calibration flags
   */
  public async calculateGrade(reviewId: string, actor: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    const criteria = await Criterion.find({ isDeleted: false });
    const criteriaMap = new Map(criteria.map((c) => [c._id.toString(), c]));

    const ratings = await ReviewRating.find({ reviewId: review._id });
    const feedbackList = await ReviewFeedback.find({ reviewId: review._id });
    const metrics = await ReviewMetric.findOne({ reviewId: review._id });

    const selfRatings = ratings
      .filter((r) => r.reviewerType === 'SELF')
      .map((r) => ({
        criterionId: r.criterionId.toString(),
        criterionName: criteriaMap.get(r.criterionId.toString())?.name || 'Criterion',
        weight: criteriaMap.get(r.criterionId.toString())?.weight || 15,
        score: r.score,
      }));

    const seniorRatings = ratings
      .filter((r) => r.reviewerType === 'SENIOR')
      .map((r) => ({
        criterionId: r.criterionId.toString(),
        criterionName: criteriaMap.get(r.criterionId.toString())?.name || 'Criterion',
        weight: criteriaMap.get(r.criterionId.toString())?.weight || 15,
        score: r.score,
      }));

    const pmRatings = ratings
      .filter((r) => r.reviewerType === 'PM')
      .map((r) => ({
        criterionId: r.criterionId.toString(),
        criterionName: criteriaMap.get(r.criterionId.toString())?.name || 'Criterion',
        weight: criteriaMap.get(r.criterionId.toString())?.weight || 15,
        score: r.score,
      }));

    const pmFeedback = feedbackList.find((f) => f.reviewerType === 'PM');
    const seniorFeedback = feedbackList.find((f) => f.reviewerType === 'SENIOR');

    const result = gradeEngine.evaluate({
      selfRatings: selfRatings.length > 0 ? selfRatings : undefined,
      seniorRatings,
      pmRatings: pmRatings.length > 0 ? pmRatings : undefined,
      selfSubmitted: !!review.selfSubmittedAt,
      missedDeadlines: metrics?.missedDeadlines || 0,
      pmExceptionalContribution: pmFeedback?.pmExceptionalContribution,
      seniorJustificationProvided: !!seniorFeedback?.seniorJustification,
    });

    review.finalScore = result.finalScore;
    review.calculatedGrade = result.grade;
    review.gradeCalculatedAt = new Date();
    review.status = REVIEW_STATUS.GRADE_CALCULATED;
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'GRADE_CALCULATED',
      userId: actor._id,
      userName: `${actor.firstName} ${actor.lastName}`,
      userEmail: actor.email,
      newValue: { finalScore: result.finalScore, calculatedGrade: result.grade, flags: result.flags },
    });

    return review;
  }

  /**
   * HR Grade Override with mandatory justification (BR-GRADE-005)
   */
  public async overrideGrade(
    reviewId: string,
    newGrade: string,
    reason: string,
    newScore: number | undefined,
    hrUser: IUser
  ): Promise<IReview> {
    if (!hrUser.roles.includes('HR_ADMIN') && !hrUser.roles.includes('SUPER_ADMIN')) {
      throw AppError.forbidden('Only HR Administrators can override review grades (BR-GRADE-005).');
    }

    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    if (!reason || !reason.trim()) {
      throw AppError.badRequest('A mandatory reason is required for grade overrides (BR-GRADE-005).');
    }

    const originalGrade = review.calculatedGrade || 'Pending';
    const originalScore = review.finalScore || 0;

    await Override.create({
      reviewId: review._id,
      originalGrade,
      originalScore,
      overriddenGrade: newGrade,
      overriddenScore: newScore,
      reason,
      overriddenBy: hrUser._id,
    });

    review.calculatedGrade = newGrade;
    if (newScore !== undefined) review.finalScore = newScore;
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'GRADE_OVERRIDDEN',
      userId: hrUser._id,
      userName: `${hrUser.firstName} ${hrUser.lastName}`,
      userEmail: hrUser.email,
      oldValue: { grade: originalGrade, score: originalScore },
      newValue: { grade: newGrade, score: newScore, reason },
    });

    return review;
  }

  /**
   * HR Publishes Review (BR-REVIEW-001)
   */
  public async publishReview(reviewId: string, hrUser: IUser): Promise<IReview> {
    if (!hrUser.roles.includes('HR_ADMIN') && !hrUser.roles.includes('SUPER_ADMIN')) {
      throw AppError.forbidden('Only HR Administrators can publish appraisal reviews (BR-REVIEW-001).');
    }

    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    review.status = REVIEW_STATUS.PUBLISHED;
    review.publishedAt = new Date();
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'REVIEW_PUBLISHED',
      userId: hrUser._id,
      userName: `${hrUser.firstName} ${hrUser.lastName}`,
      userEmail: hrUser.email,
    });

    return review;
  }

  /**
   * Employee Acknowledges Review
   */
  public async acknowledgeReview(reviewId: string, comments: string | undefined, employeeUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    if (!review.employeeId.equals(employeeUser._id)) {
      throw AppError.forbidden('You can only acknowledge your own review.');
    }

    if (review.status !== REVIEW_STATUS.PUBLISHED) {
      throw AppError.badRequest('Only published reviews can be acknowledged.');
    }

    review.status = REVIEW_STATUS.ACKNOWLEDGED;
    review.acknowledgedAt = new Date();
    if (comments) review.employeeComments = comments;
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'REVIEW_ACKNOWLEDGED',
      userId: employeeUser._id,
      userName: `${employeeUser.firstName} ${employeeUser.lastName}`,
      userEmail: employeeUser.email,
    });

    return review;
  }

  /**
   * Employee Disputes Review
   */
  public async disputeReview(reviewId: string, disputeReason: string, employeeUser: IUser): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) throw AppError.notFound('Review not found.');

    if (!review.employeeId.equals(employeeUser._id)) {
      throw AppError.forbidden('You can only dispute your own review.');
    }

    if (review.status !== REVIEW_STATUS.PUBLISHED) {
      throw AppError.badRequest('Only published reviews can be disputed.');
    }

    if (!disputeReason || !disputeReason.trim()) {
      throw AppError.badRequest('A dispute reason is required.');
    }

    review.status = REVIEW_STATUS.DISPUTED;
    review.isDisputed = true;
    review.disputeReason = disputeReason;
    review.disputedAt = new Date();
    await review.save();

    await auditService.log({
      entity: 'REVIEW',
      entityId: review._id.toString(),
      action: 'REVIEW_DISPUTED',
      userId: employeeUser._id,
      userName: `${employeeUser.firstName} ${employeeUser.lastName}`,
      userEmail: employeeUser.email,
      newValue: { disputeReason },
    });

    return review;
  }
}

export const reviewWorkflowService = new ReviewWorkflowService();
