import { Types, FilterQuery } from 'mongoose';
import { Project, IProject } from '../../models/Project.model.js';
import { ProjectMember, IProjectMember } from '../../models/ProjectMember.model.js';
import { ProjectDocument, IProjectDocument } from '../../models/ProjectDocument.model.js';

export interface FindProjectsParams {
  filter: FilterQuery<IProject>;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ProjectsRepository {
  public async findProjects({
    filter,
    page = 1,
    limit = 20,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: FindProjectsParams) {
    const query: FilterQuery<IProject> = { ...filter, isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { projectCode: searchRegex },
        { client: searchRegex },
      ];
    }

    const maxLimit = Math.min(limit, 100);
    const skip = (page - 1) * maxLimit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('projectManagerId', 'firstName lastName email employeeCode')
        .populate('projectLeadId', 'firstName lastName email employeeCode')
        .populate('departmentId', 'name code')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(maxLimit)
        .lean(),
      Project.countDocuments(query),
    ]);

    return {
      projects: projects as unknown as IProject[],
      total,
      page,
      limit: maxLimit,
      totalPages: Math.ceil(total / maxLimit),
    };
  }

  public async findById(id: string | Types.ObjectId): Promise<IProject | null> {
    return Project.findOne({ _id: id, isDeleted: false })
      .populate('projectManagerId', 'firstName lastName email employeeCode designation')
      .populate('projectLeadId', 'firstName lastName email employeeCode designation')
      .populate('departmentId', 'name code')
      .lean() as unknown as IProject | null;
  }

  public async findMembers(projectId: string | Types.ObjectId): Promise<IProjectMember[]> {
    return ProjectMember.find({ projectId, isDeleted: false })
      .populate('userId', 'firstName lastName email employeeCode designation level')
      .sort({ createdAt: -1 })
      .lean() as unknown as IProjectMember[];
  }

  public async findDocuments(projectId: string | Types.ObjectId): Promise<IProjectDocument[]> {
    return ProjectDocument.find({ projectId, isDeleted: false })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ title: 1, version: -1 })
      .lean() as unknown as IProjectDocument[];
  }
}

export const projectsRepository = new ProjectsRepository();
