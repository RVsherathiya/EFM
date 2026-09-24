import { Request, Response } from 'express';
import { reviewsService } from './reviews.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ReviewsController {
  public async getMyReviews(req: Request, res: Response): Promise<void> {
    const reviews = await reviewsService.getMyReviews(req.user!);
    sendSuccess(res, reviews);
  }

  public async getPendingReviews(req: Request, res: Response): Promise<void> {
    const reviews = await reviewsService.getPendingReviews(req.user!);
    sendSuccess(res, reviews);
  }

  public async getCalibrationReviews(req: Request, res: Response): Promise<void> {
    const { cycleId } = req.query;
    const reviews = await reviewsService.getCalibrationReviews(cycleId as string | undefined);
    sendSuccess(res, reviews);
  }

  public async getReviewDetail(req: Request, res: Response): Promise<void> {
    const data = await reviewsService.getReviewDetail(req.params.id, req.user!);
    sendSuccess(res, data);
  }

  public async submitSelf(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.submitSelf(req.params.id, req.body, req.user!);
    sendSuccess(res, review);
  }

  public async submitSenior(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.submitSenior(req.params.id, req.body, req.user!);
    sendSuccess(res, review);
  }

  public async submitPM(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.submitPM(req.params.id, req.body, req.user!);
    sendSuccess(res, review);
  }

  public async sendBack(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.sendBack(req.params.id, req.body.reason, req.user!);
    sendSuccess(res, review);
  }

  public async override(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.override(
      req.params.id,
      req.body.grade,
      req.body.reason,
      req.body.score,
      req.user!
    );
    sendSuccess(res, review);
  }

  public async publish(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.publish(req.params.id, req.user!);
    sendSuccess(res, review);
  }

  public async acknowledge(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.acknowledge(req.params.id, req.body.comments, req.user!);
    sendSuccess(res, review);
  }

  public async dispute(req: Request, res: Response): Promise<void> {
    const review = await reviewsService.dispute(req.params.id, req.body.reason, req.user!);
    sendSuccess(res, review);
  }
}

export const reviewsController = new ReviewsController();
