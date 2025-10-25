import { StatusCodes } from 'http-status-codes';
import { ApiError } from './error.js';

/**
 * Verify JWT token from auth service
 */
export function verifyAuthToken() {
  return (req, res, next) => {
    try {
      console.log('🔐 [AUTH] Verifying token for:', req.method, req.path);
      console.log('   Headers:', Object.keys(req.headers));

      const authHeader = req.headers.authorization || '';
      console.log('   Auth header:', authHeader ? 'Present' : 'Missing');

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        console.log('❌ [AUTH] No token provided');
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Authorization token required'
        });
      }

      try {
        // Parse JWT token (simplified - in production use jsonwebtoken library)
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('📝 [AUTH] Token payload:', { sub: payload.sub, email: payload.email, role: payload.role });

        if (!payload.sub || !payload.email) {
          console.log('❌ [AUTH] Invalid payload - missing sub or email');
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: 'Invalid token payload'
          });
        }

        // Check token expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          console.log('❌ [AUTH] Token expired');
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: 'Token expired'
          });
        }

        req.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role || 'user'
        };

        console.log('✅ [AUTH] User authenticated:', { id: req.user.id, email: req.user.email, role: req.user.role });
        next();
      } catch (jwtError) {
        console.log('❌ [AUTH] JWT parse error:', jwtError.message);
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: 'Invalid token format'
        });
      }
    } catch (err) {
      console.log('❌ [AUTH] Auth error:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };
}

/**
 * Require admin role
 */
export function requireAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }

    if (req.user.role !== 'admin') {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Admin access required'));
    }

    next();
  };
}

/**
 * Require merchant role or admin
 */
export function requireMerchantOrAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    }

    if (!['merchant', 'admin'].includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, 'Merchant or admin access required'));
    }

    next();
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth() {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (token) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

          if (payload.sub && payload.email) {
            req.user = {
              id: payload.sub,
              email: payload.email,
              role: payload.role || 'user'
            };
          }
        } catch (jwtError) {
          // Ignore invalid tokens in optional auth
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
