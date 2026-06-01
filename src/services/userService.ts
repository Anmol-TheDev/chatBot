import User, { IUser } from '../models/User.js';

export class UserService {
  static async getAllUsers(): Promise<IUser[]> {
    return await User.find().select('-password');
  }

  static async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).select('-password');
  }

  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  static async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');
  }

  static async deleteUser(id: string): Promise<IUser | null> {
    return await User.findByIdAndDelete(id);
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('+password');
  }
}