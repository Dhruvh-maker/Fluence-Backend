import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import { updateUserStatus } from '../models/user.model.js';

const statusSchema = z.object({ status: z.enum(['paused', 'deleted']) });

export async function updateAccountStatus(req, res, next) {
  try {
    const { status } = statusSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    const updated = await updateUserStatus(userId, status);
    res.status(StatusCodes.OK).json({ user: { id: updated.id, status: updated.status } });
  } catch (err) {
    if (err instanceof z.ZodError) return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payload', err.flatten()));
    next(err);
  }
}



