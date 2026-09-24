import { Types } from 'mongoose';
import { Project, IProject } from '../../models/Project.model.js';
import { ProjectMember, IProjectMember } from '../../models/ProjectMember.model.js';
import { ProjectDocument } from '../../models/ProjectDocument.model.js';
import { User, IUser } from '../../models/User.model.js';
import { projectsRepository } from './projects.repository.js';
import { projectRules } from '../../domain/project-rules/project.rules.js';
import { storageProvider } from '../../integrations/storage/index.js';
import { auditService } from '../../services/audit.service.js';
import { AppError } from '../../utils/app-error.js';
import { PROJECT_STATUS, DOCUMENT_CATEGORIES } from '../../config/constants.js';

export class ProjectsService {
  public async getProjects(currentUser: IUser, params: { page?: number; limit?: number; search?: string; status?: string; type?: string; departmentId?: string }) {
    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');
    const isPM = currentUser.roles.includes('PM');

    const filter: Record<string, unknown> = {};

    if (!isHR) {
      if (isPM) {
        // PM sees projects they manage or lead, or where they are an assigned member
        const userMemberships = await ProjectMember.find({ userId: currentUser._id, isDeleted: false }).select('projectId');
        const memberProjectIds = userMemberships.map((m) => m.projectId);
        filter.$or = [
          { projectManagerId: currentUser._id },
          { projectLeadId: currentUser._id },
          { _id: { $in: memberProjectIds } },
        ];
      } else {
        // Standard Employee / Senior sees projects they are member of
        const userMemberships = await ProjectMember.find({ userId: currentUser._id, isDeleted: false }).select('projectId');
        const memberProjectIds = userMemberships.map((m) => m.projectId);
        filter._id = { $in: memberProjectIds };
      }
    }

    if (params.status) filter.status = params.status;
    if (params.type) filter.type = params.type;
    if (params.departmentId) filter.departmentId = new Types.ObjectId(params.departmentId);

    return projectsRepository.findProjects({
      filter,
      page: params.page,
      limit: params.limit,
      search: params.search,
    });
  }

  public async getProjectById(projectId: string, currentUser: IUser): Promise<IProject> {
    const project = await projectsRepository.findById(projectId);
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    const isHR = currentUser.roles.includes('HR_ADMIN') || currentUser.roles.includes('SUPER_ADMIN');
    const pmId = (project.projectManagerId as unknown as { _id?: Types.ObjectId })?._id?.toString() || project.projectManagerId?.toString();
    const leadId = (project.projectLeadId as unknown as { _id?: Types.ObjectId })?._id?.toString() || project.projectLeadId?.toString();
    const isPM = pmId === currentUser._id.toString() || (leadId && leadId === currentUser._id.toString());

    if (!isHR && !isPM) {
      const isMember = await ProjectMember.findOne({ projectId: project._id, userId: currentUser._id, isDeleted: false });
      if (!isMember) {
        throw AppError.forbidden('You do not have permission to access this project (BR-SCOPE-003).');
      }
    }

    return project;
  }

  public async createProject(data: Partial<IProject> & { projectManagerId: string }, creatorUser: IUser): Promise<IProject> {
    const manager = await User.findOne({ _id: data.projectManagerId, isDeleted: false });
    if (!manager) {
      throw AppError.notFound('Designated Project Manager not found.');
    }

    // Auto-generate unique Project Code (PRJ-YYYY-XXX)
    const projectCode = await projectRules.generateProjectCode();

    const newProject = await Project.create({
      projectCode,
      name: data.name,
      client: data.client,
      type: data.type,
      billingModel: data.billingModel,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status || PROJECT_STATUS.ACTIVE,
      projectManagerId: new Types.ObjectId(data.projectManagerId),
      projectLeadId: data.projectLeadId ? new Types.ObjectId(data.projectLeadId.toString()) : undefined,
      departmentId: data.departmentId ? new Types.ObjectId(data.departmentId.toString()) : undefined,
      clientContact: data.clientContact,
    });

    // Automatically add Project Manager as a member
    await ProjectMember.create({
      projectId: newProject._id,
      userId: newProject.projectManagerId,
      projectRole: 'Project Manager',
      allocationPct: 100,
      defaultBillable: true,
      startDate: newProject.startDate,
    });

    await auditService.log({
      entity: 'PROJECT',
      entityId: newProject._id.toString(),
      action: 'CREATE',
      userId: creatorUser._id,
      userName: `${creatorUser.firstName} ${creatorUser.lastName}`,
      userEmail: creatorUser.email,
      newValue: { projectCode: newProject.projectCode, name: newProject.name },
    });

    return newProject;
  }

  public async updateProject(projectId: string, updates: Partial<IProject>, updaterUser: IUser): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, isDeleted: false });
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    const isHR = updaterUser.roles.includes('HR_ADMIN') || updaterUser.roles.includes('SUPER_ADMIN');
    const isPM = project.projectManagerId.toString() === updaterUser._id.toString();

    if (!isHR && !isPM) {
      throw AppError.forbidden('Only the Project Manager or HR can update this project.');
    }

    Object.assign(project, updates);
    await project.save();

    await auditService.log({
      entity: 'PROJECT',
      entityId: project._id.toString(),
      action: 'UPDATE',
      userId: updaterUser._id,
      userName: `${updaterUser.firstName} ${updaterUser.lastName}`,
      userEmail: updaterUser.email,
      newValue: updates as Record<string, unknown>,
    });

    return project;
  }

  public async getProjectMembers(projectId: string, currentUser: IUser) {
    await this.getProjectById(projectId, currentUser);
    return projectsRepository.findMembers(projectId);
  }

  public async addProjectMember(
    projectId: string,
    data: {
      userId: string;
      projectRole: string;
      allocationPct: number;
      defaultBillable: boolean;
      startDate: string | Date;
      endDate?: string | Date | null;
    },
    adderUser: IUser
  ): Promise<{ member: IProjectMember; allocationWarning?: string }> {
    const project = await this.getProjectById(projectId, adderUser);

    const user = await User.findOne({ _id: data.userId, isDeleted: false });
    if (!user) {
      throw AppError.notFound('Employee to assign not found.');
    }

    // Check existing active membership
    const existing = await ProjectMember.findOne({
      projectId: project._id,
      userId: user._id,
      isDeleted: false,
    });

    if (existing) {
      throw AppError.conflict('This employee is already an active member of this project.');
    }

    const allocationCheck = await projectRules.calculateEmployeeAllocation(user._id);
    const newTotalAllocation = allocationCheck.totalAllocationPct + data.allocationPct;

    const newMember = await ProjectMember.create({
      projectId: project._id,
      userId: user._id,
      projectRole: data.projectRole,
      allocationPct: data.allocationPct,
      defaultBillable: project.type === 'INTERNAL' ? false : data.defaultBillable, // BR-PROJ-003: Internal is Non-Billable
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    let allocationWarning: string | undefined;
    if (newTotalAllocation > 100) {
      allocationWarning = `Warning: ${user.firstName} ${user.lastName}'s total allocation across all projects is now ${newTotalAllocation}%.`;
    }

    await auditService.log({
      entity: 'PROJECT_MEMBER',
      entityId: newMember._id.toString(),
      action: 'MEMBER_ASSIGNED',
      userId: adderUser._id,
      userName: `${adderUser.firstName} ${adderUser.lastName}`,
      userEmail: adderUser.email,
      newValue: { projectId, userId: data.userId, allocationPct: data.allocationPct },
    });

    return { member: newMember, allocationWarning };
  }

  public async removeProjectMember(projectId: string, memberId: string, removerUser: IUser): Promise<void> {
    const member = await ProjectMember.findOne({ _id: memberId, projectId, isDeleted: false });
    if (!member) {
      throw AppError.notFound('Project member assignment not found.');
    }

    // BR-PROJ-004: Soft removal via end-date assignment, never delete historical records
    member.endDate = new Date();
    await member.save();

    await auditService.log({
      entity: 'PROJECT_MEMBER',
      entityId: member._id.toString(),
      action: 'MEMBER_REMOVED',
      userId: removerUser._id,
      userName: `${removerUser.firstName} ${removerUser.lastName}`,
      userEmail: removerUser.email,
    });
  }

  public async getProjectDocuments(projectId: string, currentUser: IUser) {
    await this.getProjectById(projectId, currentUser);
    return projectsRepository.findDocuments(projectId);
  }

  public async uploadDocument(
    projectId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    data: { title: string; category: (typeof DOCUMENT_CATEGORIES)[number]; description?: string },
    uploaderUser: IUser
  ) {
    const project = await this.getProjectById(projectId, uploaderUser);

    // Check existing documents with the same title on this project for versioning (BR-PROJ-005)
    const latestDoc = await ProjectDocument.findOne({
      projectId: project._id,
      title: data.title.trim(),
      isDeleted: false,
    }).sort({ version: -1 });

    const newVersion = latestDoc ? latestDoc.version + 1 : 1;

    // Upload via StorageProvider abstraction
    const uploadResult = await storageProvider.uploadFile(fileBuffer, originalName, mimeType);

    const doc = await ProjectDocument.create({
      projectId: project._id,
      title: data.title.trim(),
      category: data.category,
      description: data.description,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      mimeType: uploadResult.mimeType,
      storageKey: uploadResult.storageKey,
      version: newVersion,
      uploadedBy: uploaderUser._id,
    });

    await auditService.log({
      entity: 'PROJECT_DOCUMENT',
      entityId: doc._id.toString(),
      action: 'DOCUMENT_UPLOAD',
      userId: uploaderUser._id,
      userName: `${uploaderUser.firstName} ${uploaderUser.lastName}`,
      userEmail: uploaderUser.email,
      newValue: { title: doc.title, version: doc.version, fileName: doc.fileName },
    });

    return doc;
  }

  public async getDocumentDownload(docId: string, currentUser: IUser) {
    const doc = await ProjectDocument.findOne({ _id: docId, isDeleted: false });
    if (!doc) {
      throw AppError.notFound('Document not found.');
    }

    // Enforce authorization before every download (Section 22)
    await this.getProjectById(doc.projectId.toString(), currentUser);

    const fileData = await storageProvider.getFileStream(doc.storageKey);
    return {
      stream: fileData.stream,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
    };
  }
}

export const projectsService = new ProjectsService();
