import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import { updateUserProfile, findUserById } from '../models/user.model.js';
import { signToken } from '../utils/jwt.js';

const profileSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255)
});

export async function completeProfile(req, res, next) {
  try {
    const { name, email } = profileSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }

    // Check if user exists and needs profile completion
    const user = await findUserById(userId);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Update user profile
    const updatedUser = await updateUserProfile(userId, name, email);
    
    // Generate new token with updated email
    const token = signToken({ sub: updatedUser.id, email: updatedUser.email });
    
    res.status(StatusCodes.OK).json({
      user: { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email,
        created_at: updatedUser.created_at
      },
      token,
      message: 'Profile completed successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid profile data', err.flatten()));
    }
    next(err);
  }
}


