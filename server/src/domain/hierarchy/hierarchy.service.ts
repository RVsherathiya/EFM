import { Types } from 'mongoose';
import { User } from '../../models/User.model.js';
import { UserHierarchy } from '../../models/UserHierarchy.model.js';
import { ManagerHistory } from '../../models/ManagerHistory.model.js';
import { AppError } from '../../utils/app-error.js';

export class HierarchyService {
  /**
   * Validate that setting newManagerId for userId does not introduce a cycle or self-report.
   * BR-ORG-002: Hierarchy must be an acyclic DAG.
   */
  public async validateManagerAssignment(userId: string | Types.ObjectId, newManagerId?: string | Types.ObjectId | null): Promise<void> {
    if (!newManagerId) {
      return; // Top of the hierarchy / No manager
    }

    const uId = new Types.ObjectId(userId.toString());
    const mId = new Types.ObjectId(newManagerId.toString());

    // 1. Self-reporting check
    if (uId.equals(mId)) {
      throw AppError.badRequest('Self-reporting is strictly prohibited (BR-ORG-002). An employee cannot be their own manager.');
    }

    // 2. Check if the proposed manager exists and is active
    const manager = await User.findOne({ _id: mId, isDeleted: false });
    if (!manager) {
      throw AppError.notFound('Proposed manager does not exist or is inactive.');
    }

    // 3. Cycle check: Check if userId is already an ancestor of newManagerId
    // If uId is an ancestor of mId, making mId the manager of uId would create a cycle!
    const isAncestor = await UserHierarchy.findOne({
      ancestorId: uId,
      descendantId: mId,
    });

    if (isAncestor) {
      throw AppError.badRequest(
        'Hierarchy cycle detected (BR-ORG-002). The proposed manager is already a direct or indirect report of this employee.'
      );
    }
  }

  /**
   * Rebuilds the UserHierarchy materialized closure table for the entire organization or a subtree.
   */
  public async rebuildHierarchyTree(): Promise<void> {
    // 1. Clear existing hierarchy relations
    await UserHierarchy.deleteMany({});

    // 2. Fetch all active non-deleted users
    const allUsers = await User.find({ isDeleted: false }).select('_id managerId').lean();
    const userMap = new Map<string, string | undefined>();
    for (const u of allUsers) {
      userMap.set(u._id.toString(), u.managerId?.toString());
    }

    const relations: Array<{ ancestorId: Types.ObjectId; descendantId: Types.ObjectId; depth: number }> = [];

    for (const u of allUsers) {
      const uIdStr = u._id.toString();
      let currentManagerId = userMap.get(uIdStr);
      let depth = 1;
      const visited = new Set<string>([uIdStr]);

      while (currentManagerId) {
        if (visited.has(currentManagerId)) {
          // Cycle detected in raw data, break to prevent infinite loop
          break;
        }
        visited.add(currentManagerId);

        relations.push({
          ancestorId: new Types.ObjectId(currentManagerId),
          descendantId: new Types.ObjectId(uIdStr),
          depth,
        });

        currentManagerId = userMap.get(currentManagerId);
        depth++;
      }
    }

    if (relations.length > 0) {
      await UserHierarchy.insertMany(relations, { ordered: false });
    }
  }

  /**
   * Updates an employee's manager with validation and maintains ManagerHistory.
   * BR-ORG-003 & BR-ORG-004
   */
  public async updateManager(
    userId: string | Types.ObjectId,
    newManagerId: string | Types.ObjectId | null,
    changedById: string | Types.ObjectId,
    reason?: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw AppError.notFound('Employee not found.');
    }

    if (newManagerId) {
      await this.validateManagerAssignment(userId, newManagerId);
    }

    const previousManagerId = user.managerId;
    const isSameManager = (previousManagerId && newManagerId && previousManagerId.toString() === newManagerId.toString()) ||
      (!previousManagerId && !newManagerId);

    if (isSameManager) {
      return; // No change needed
    }

    // Close previous ManagerHistory record if exists
    if (previousManagerId) {
      await ManagerHistory.findOneAndUpdate(
        { userId: user._id, effectiveTo: { $exists: false } },
        { effectiveTo: new Date() },
        { sort: { effectiveFrom: -1 } }
      );
    }

    // Create new ManagerHistory record
    if (newManagerId) {
      await ManagerHistory.create({
        userId: user._id,
        managerId: new Types.ObjectId(newManagerId.toString()),
        effectiveFrom: new Date(),
        changedBy: new Types.ObjectId(changedById.toString()),
        reason: reason || 'Manager reassignment',
      });
    }

    user.managerId = newManagerId ? new Types.ObjectId(newManagerId.toString()) : undefined;
    await user.save();

    // Rebuild materialized hierarchy table
    await this.rebuildHierarchyTree();
  }

  /**
   * Get all descendant user IDs for a given manager.
   */
  public async getDescendantUserIds(managerId: string | Types.ObjectId, directOnly = false): Promise<Types.ObjectId[]> {
    const mId = new Types.ObjectId(managerId.toString());
    const query = directOnly
      ? { ancestorId: mId, depth: 1 }
      : { ancestorId: mId };

    const records = await UserHierarchy.find(query).select('descendantId').lean();
    return records.map((r) => r.descendantId);
  }

  /**
   * Get all ancestor user IDs (management chain) for a given user.
   */
  public async getAncestorUserIds(userId: string | Types.ObjectId): Promise<Types.ObjectId[]> {
    const uId = new Types.ObjectId(userId.toString());
    const records = await UserHierarchy.find({ descendantId: uId }).sort({ depth: 1 }).select('ancestorId').lean();
    return records.map((r) => r.ancestorId);
  }
}

export const hierarchyService = new HierarchyService();
