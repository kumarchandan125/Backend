import { User } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';

export class ProfileService {
  /**
   * Get full user profile with shop details.
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId).populate('tenantId', 'name email phone address subscription');
    if (!user) throw ApiError.notFound('User not found');

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto || '',
      shop: user.tenantId,
    };
  }

  /**
   * Update user name or email.
   */
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found');
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto || '',
    };
  }

  /**
   * Change password — requires current password.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    user.password = newPassword;
    await user.save(); // triggers the pre-save hash hook
    return true;
  }

  /**
   * Save the uploaded profile photo path.
   */
  async uploadPhoto(userId: string, photoPath: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: photoPath },
      { new: true }
    );
    if (!user) throw ApiError.notFound('User not found');
    return { profilePhoto: user.profilePhoto };
  }
}

export const profileService = new ProfileService();
