import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.js';
import { findUserById } from '../models/user.model.js';

export function requireAuth(allowedStatuses = ['active']) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      }
      const payload = verifyToken(token);
      const user = await findUserById(payload.sub);
      if (!user) return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
      if (!allowedStatuses.includes(user.status)) {
        return res.status(StatusCodes.FORBIDDEN).json({ error: `Account ${user.status}` });
      }
      req.user = { id: user.id, email: user.email, status: user.status, role: user.role };
      next();
    } catch (err) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Unauthorized' });
    }
  };
}



