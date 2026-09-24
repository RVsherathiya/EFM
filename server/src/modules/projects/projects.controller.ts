import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  createDocumentSchema,
} from './projects.validation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/app-error.js';

export class ProjectsController {
  public async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;

      const result = await projectsService.getProjects(req.user, {
        page,
        limit,
        search,
        status,
        type,
        departmentId,
      });

      sendSuccess(res, result.projects, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const project = await projectsService.getProjectById(req.params.id, req.user);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  public async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = createProjectSchema.parse(req.body);
      const project = await projectsService.createProject(validatedData as unknown as Parameters<typeof projectsService.createProject>[0], req.user);
      sendSuccess(res, project, 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = updateProjectSchema.parse(req.body);
      const project = await projectsService.updateProject(req.params.id, validatedData as unknown as Parameters<typeof projectsService.updateProject>[1], req.user);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  public async getProjectMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const members = await projectsService.getProjectMembers(req.params.id, req.user);
      sendSuccess(res, members);
    } catch (error) {
      next(error);
    }
  }

  public async addProjectMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validatedData = addProjectMemberSchema.parse(req.body);
      const result = await projectsService.addProjectMember(req.params.id, validatedData, req.user);
      sendSuccess(res, result.member, 201, { allocationWarning: result.allocationWarning });
    } catch (error) {
      next(error);
    }
  }

  public async removeProjectMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      await projectsService.removeProjectMember(req.params.id, req.params.memberId, req.user);
      sendSuccess(res, { message: 'Member end-dated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  public async getProjectDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const docs = await projectsService.getProjectDocuments(req.params.id, req.user);
      sendSuccess(res, docs);
    } catch (error) {
      next(error);
    }
  }

  public async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      if (!req.file) {
        throw AppError.badRequest('File is required for upload.');
      }

      const validatedData = createDocumentSchema.parse(req.body);
      const doc = await projectsService.uploadDocument(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        validatedData,
        req.user
      );

      sendSuccess(res, doc, 201);
    } catch (error) {
      next(error);
    }
  }

  public async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw AppError.unauthorized();
      const fileData = await projectsService.getDocumentDownload(req.params.docId, req.user);

      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.fileName)}"`);
      res.setHeader('Content-Length', fileData.fileSize);

      fileData.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
