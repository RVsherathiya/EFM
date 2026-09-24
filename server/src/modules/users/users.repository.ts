import { Types, FilterQuery } from 'mongoose';
import { User, IUser } from '../../models/User.model.js';

export interface FindUsersParams {
  filter: FilterQuery<IUser>;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class UsersRepository {
  public async findUsers({
    filter,
    page = 1,
    limit = 20,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }: FindUsersParams): Promise<{ users: IUser[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: FilterQuery<IUser> = { ...filter, isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
      ];
    }

    const maxLimit = Math.min(limit, 100); // Enforce max limit server-side (Section 67)
    const skip = (page - 1) * maxLimit;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('departmentId', 'name code')
        .populate('managerId', 'firstName lastName email employeeCode designation')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(maxLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    const mappedUsers = (users as any[]).map((u) => ({
      ...u,
      id: u._id?.toString(),
      fullName:
        u.fullName ||
        `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
        u.email ||
        'Unknown Employee',
    }));

    return {
      users: mappedUsers as unknown as IUser[],
      total,
      page,
      limit: maxLimit,
      totalPages: Math.ceil(total / maxLimit),
    };
  }

  public async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    const user = await User.findOne({ _id: id, isDeleted: false })
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email employeeCode designation')
      .lean();

    if (!user) return null;

    return {
      ...user,
      id: user._id?.toString(),
      fullName:
        (user as any).fullName ||
        `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() ||
        (user as any).email,
    } as unknown as IUser;
  }

  public async findByEmployeeCode(code: string): Promise<IUser | null> {
    return User.findOne({ employeeCode: code.toUpperCase(), isDeleted: false });
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false });
  }
}

export const usersRepository = new UsersRepository();

