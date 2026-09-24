import { User, IUser } from '../../models/User.model.js';

export class AuthRepository {
  public async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
  }

  public async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false }).populate('departmentId', 'name code');
  }
}

export const authRepository = new AuthRepository();
