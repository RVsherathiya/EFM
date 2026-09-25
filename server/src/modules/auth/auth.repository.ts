import { User, IUser } from '../../models/User.model.js';

export class AuthRepository {
  public async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase(), isDeleted: false });
  }

  public async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false }).populate('departmentId', 'name code');
  }

  public async saveResetToken(userId: string, hashedToken: string, expires: Date): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    });
  }

  public async findByValidResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isDeleted: false,
    }).select('+passwordHash +passwordResetToken +passwordResetExpires');
  }

  public async updatePasswordAndClearResetToken(userId: string, passwordHash: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      },
      { new: true }
    );
  }
}

export const authRepository = new AuthRepository();
