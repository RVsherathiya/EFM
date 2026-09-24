import { Types, FilterQuery } from 'mongoose';
import { Review, IReview } from '../../models/Review.model.js';
import { ReviewRating } from '../../models/ReviewRating.model.js';
import { ReviewFeedback } from '../../models/ReviewFeedback.model.js';
import { ReviewMetric } from '../../models/ReviewMetric.model.js';
import { Override } from '../../models/Override.model.js';
import { Criterion } from '../../models/Criterion.model.js';
import { IUser } from '../../models/User.model.js';
import { reviewWorkflowService, SubmitSelfReviewDto, SubmitSeniorReviewDto, SubmitPMReviewDto } from '../../domain/review-workflow/review.workflow.service.js';
import { hierarchyService } from '../../domain/hierarchy/hierarchy.service.js';
import { AppError } from '../../utils/app-error.js';
import { REVIEW_STATUS } from '../../config/constants.js';

export class ReviewsService {
  public async getMyReviews(currentUser: IUser) {
    return Review.find({ employeeId: currentUser._id, isDeleted: false })
      .populate('cycleId')
      .populate('seniorId', 'firstName lastName email employeeCode designation')
      .populate('pmId', 'firstName lastName email employeeCode designation')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async getPendingReviews(currentUser: IUser) {
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');
    const isSenior = currentUser.roles.includes('SENIOR');
    const isPM = currentUser.roles.includes('PM');

    const descendantIds = isSenior ? await hierarchyService.getDescendantUserIds(currentUser._id) : [];

    const conditions: FilterQuery<IReview>[] = [];

    if (isSenior) {
      conditions.push({
        $or: [{ seniorId: currentUser._id }, { employeeId: { $in: descendantIds } }],
        status: { $in: [REVIEW_STATUS.SELF_SUBMITTED, REVIEW_STATUS.SENIOR_PENDING] },
        isDeleted: false,
      });
    }

    if (isPM) {
      conditions.push({
        pmId: currentUser._id,
        status: { $in: [REVIEW_STATUS.SENIOR_SUBMITTED, REVIEW_STATUS.PM_PENDING] },
        isDeleted: false,
      });
    }

    if (isHR) {
      conditions.push({
        status: { $in: [REVIEW_STATUS.GRADE_CALCULATED, REVIEW_STATUS.DISPUTED] },
        isDeleted: false,
      });
    }

    if (conditions.length === 0) {
      return [];
    }

    return Review.find({ $or: conditions })
      .populate('cycleId')
      .populate('employeeId', 'firstName lastName email employeeCode designation departmentId')
      .populate('seniorId', 'firstName lastName email employeeCode designation')
      .populate('pmId', 'firstName lastName email employeeCode designation')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async getCalibrationReviews(cycleId?: string) {
    const filter: FilterQuery<IReview> = {
      status: { $in: [REVIEW_STATUS.GRADE_CALCULATED, REVIEW_STATUS.PUBLISHED, REVIEW_STATUS.ACKNOWLEDGED, REVIEW_STATUS.DISPUTED] },
      isDeleted: false,
    };
    if (cycleId) {
      filter.cycleId = new Types.ObjectId(cycleId);
    }

    return Review.find(filter)
      .populate('cycleId')
      .populate('employeeId', 'firstName lastName email employeeCode designation departmentId')
      .populate('seniorId', 'firstName lastName email employeeCode designation')
      .populate('pmId', 'firstName lastName email employeeCode designation')
      .sort({ finalScore: -1 })
      .lean();
  }

  public async getReviewDetail(reviewId: string, currentUser: IUser) {
    const review = await Review.findOne({ _id: reviewId, isDeleted: false })
      .populate('cycleId')
      .populate('employeeId', 'firstName lastName email employeeCode designation departmentId')
      .populate('seniorId', 'firstName lastName email employeeCode designation')
      .populate('pmId', 'firstName lastName email employeeCode designation')
      .lean();

    if (!review) throw AppError.notFound('Review not found.');

    const isEmployee = (review.employeeId as any)._id.toString() === currentUser._id.toString();
    const isSenior = (review.seniorId as any)?._id.toString() === currentUser._id.toString();
    const isPM = (review.pmId as any)?._id?.toString() === currentUser._id.toString();
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');

    if (!isEmployee && !isSenior && !isPM && !isHR) {
      // Check hierarchy tree
      const descendantIds = await hierarchyService.getDescendantUserIds(currentUser._id);
      const isSubordinate = descendantIds.some((d) => d.toString() === (review.employeeId as any)._id.toString());
      if (!isSubordinate) {
        throw AppError.forbidden('Access denied (BR-SCOPE-006). You do not have permission to view this review.');
      }
    }

    // Refresh review metrics snapshot if cycle exists
    if (review.cycleId && typeof review.cycleId === 'object') {
      const cycleObj = review.cycleId as any;
      await reviewWorkflowService.computeReviewMetrics(
        review._id as Types.ObjectId,
        (review.employeeId as any)._id as Types.ObjectId,
        new Date(cycleObj.periodStart),
        new Date(cycleObj.periodEnd)
      );
    }

    const criteria = await Criterion.find({ isDeleted: false }).sort({ sortOrder: 1 }).lean();
    const ratings = await ReviewRating.find({ reviewId: review._id }).lean();
    const feedback = await ReviewFeedback.find({ reviewId: review._id }).lean();
    const metrics = await ReviewMetric.findOne({ reviewId: review._id }).lean();
    const overrides = await Override.find({ reviewId: review._id }).populate('overriddenBy', 'firstName lastName email').sort({ createdAt: -1 }).lean();

    // BR-REVIEW-001: Privacy Rules before publishing:
    // If the viewer is the employee and review is not yet PUBLISHED or ACKNOWLEDGED:
    // Filter out Senior and PM ratings/feedback so employee cannot preview before publication!
    const isPublishedStage = [REVIEW_STATUS.PUBLISHED, REVIEW_STATUS.ACKNOWLEDGED, REVIEW_STATUS.DISPUTED].includes(review.status as any);

    let sanitizedRatings = ratings;
    let sanitizedFeedback = feedback;

    if (isEmployee && !isHR && !isPublishedStage) {
      sanitizedRatings = ratings.filter((r) => r.reviewerType === 'SELF');
      sanitizedFeedback = feedback.filter((f) => f.reviewerType === 'SELF');
    }

    return {
      review,
      criteria,
      ratings: sanitizedRatings,
      feedback: sanitizedFeedback,
      metrics,
      overrides,
      permissions: {
        canSubmitSelf: isEmployee && (review.status === REVIEW_STATUS.DRAFT || review.status === REVIEW_STATUS.SELF_PENDING),
        canSubmitSenior: (isSenior || isHR) && (review.status === REVIEW_STATUS.SELF_SUBMITTED || review.status === REVIEW_STATUS.SENIOR_PENDING),
        canSubmitPM: (isPM || isHR) && (review.status === REVIEW_STATUS.SENIOR_SUBMITTED || review.status === REVIEW_STATUS.PM_PENDING),
        canSendBack: (isPM || isHR) && (review.status === REVIEW_STATUS.SENIOR_SUBMITTED || review.status === REVIEW_STATUS.PM_PENDING) && review.pmSendBackCount < 1,
        canOverride: isHR && isPublishedStage || (isHR && review.status === REVIEW_STATUS.GRADE_CALCULATED),
        canPublish: isHR && review.status === REVIEW_STATUS.GRADE_CALCULATED,
        canAcknowledge: isEmployee && review.status === REVIEW_STATUS.PUBLISHED,
        canDispute: isEmployee && review.status === REVIEW_STATUS.PUBLISHED,
      },
    };
  }

  public async submitSelf(reviewId: string, input: SubmitSelfReviewDto, user: IUser) {
    return reviewWorkflowService.submitSelfReview(reviewId, input, user);
  }

  public async submitSenior(reviewId: string, input: SubmitSeniorReviewDto, user: IUser) {
    return reviewWorkflowService.submitSeniorReview(reviewId, input, user);
  }

  public async submitPM(reviewId: string, input: SubmitPMReviewDto, user: IUser) {
    return reviewWorkflowService.submitPMReview(reviewId, input, user);
  }

  public async sendBack(reviewId: string, reason: string, user: IUser) {
    return reviewWorkflowService.sendBackToSenior(reviewId, reason, user);
  }

  public async override(reviewId: string, grade: string, reason: string, score: number | undefined, user: IUser) {
    return reviewWorkflowService.overrideGrade(reviewId, grade, reason, score, user);
  }

  public async publish(reviewId: string, user: IUser) {
    return reviewWorkflowService.publishReview(reviewId, user);
  }

  public async acknowledge(reviewId: string, comments: string | undefined, user: IUser) {
    return reviewWorkflowService.acknowledgeReview(reviewId, comments, user);
  }

  public async dispute(reviewId: string, reason: string, user: IUser) {
    return reviewWorkflowService.disputeReview(reviewId, reason, user);
  }
}

export const reviewsService = new ReviewsService();
