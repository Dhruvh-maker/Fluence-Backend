import { StatusCodes } from 'http-status-codes';
import { signToken } from '../utils/jwt.js';

export async function guestLogin(_req, res) {
  // Issue a short-lived token with a synthetic subject; not persisted.
  const anonId = `guest_${Math.random().toString(36).slice(2)}`;
  const token = signToken({ sub: anonId, email: 'guest@local' });
  res.status(StatusCodes.OK).json({ guest: true, token });
}



