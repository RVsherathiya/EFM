import { Types } from 'mongoose';
import { Project } from '../../models/Project.model.js';
import { ProjectMember } from '../../models/ProjectMember.model.js';

export class ProjectRules {
  /**
   * Generates next project code in sequence: PRJ-YYYY-XXX (e.g. PRJ-2026-001)
   */
  public async generateProjectCode(year = new Date().getFullYear()): Promise<string> {
    const prefix = `PRJ-${year}-`;
    const count = await Project.countDocuments({
      projectCode: { $regex: `^${prefix}` },
    });

    const sequence = (count + 1).toString().padStart(3, '0');
    return `${prefix}${sequence}`;
  }

  /**
   * Calculates total active allocation percentage across all projects for an employee.
   * Warns if > 100%. (BR-PROJ)
   */
  public async calculateEmployeeAllocation(
    userId: string | Types.ObjectId,
    excludeMemberId?: string | Types.ObjectId
  ): Promise<{ totalAllocationPct: number; exceeds100: boolean }> {
    const uId = new Types.ObjectId(userId.toString());
    const query: Record<string, unknown> = {
      userId: uId,
      isDeleted: false,
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }],
    };

    if (excludeMemberId) {
      query._id = { $ne: new Types.ObjectId(excludeMemberId.toString()) };
    }

    const activeMemberships = await ProjectMember.find(query).select('allocationPct').lean();
    const totalAllocationPct = activeMemberships.reduce((sum, m) => sum + (m.allocationPct || 0), 0);

    return {
      totalAllocationPct,
      exceeds100: totalAllocationPct > 100,
    };
  }
}

export const projectRules = new ProjectRules();
