import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../middleware/error.js';
import { verifyFirebaseIdToken } from '../services/firebase.service.js';
import { createUser, findUserByEmail, findUserByProvider } from '../models/user.model.js';
import { signToken } from '../utils/jwt.js';

export async function loginWithFirebase(req, res, next) {
  try {
    const token = (req.body?.idToken || '').trim();
    const referralCode = req.body?.referralCode || null;
    if (!token) throw new ApiError(StatusCodes.BAD_REQUEST, 'idToken required');
    const decoded = await verifyFirebaseIdToken(token);
    const provider = decoded.firebase?.sign_in_provider || 'password';
    const providerId = decoded.uid;
    const email = decoded.email || (decoded.phone_number ? `${decoded.phone_number}@phone.local` : undefined);
    // For new users, we'll use placeholder name regardless of what Firebase provides
    const firebaseName = decoded.name || decoded.email || 'Firebase User';

    let mappedProvider = provider;
    if (provider === 'google.com') mappedProvider = 'google';
    if (provider === 'facebook.com') mappedProvider = 'facebook';
    if (provider === 'phone') mappedProvider = 'phone';

    let user = await findUserByProvider(mappedProvider, providerId);
    let isNewUser = false;
    
    if (!user) {
      const existing = email ? await findUserByEmail(email) : null;
      if (existing) {
        user = existing;
      } else {
        // Create user with placeholder data for first-time users
        user = await createUser({
          name: 'New User', // Always use placeholder for new users
          email: email || `${providerId}@${mappedProvider}.local`,
          password_hash: 'firebase-login',
          auth_provider: mappedProvider,
          provider_id: providerId,
          phone: decoded.phone_number || null
        });
        isNewUser = true;
      }
    }

    const jwt = signToken({ sub: user.id, email: user.email });
    
    // Check if user needs to complete profile (new user or has placeholder name)
    const needsProfileCompletion = isNewUser || user.name === 'New User';
    
    // Debug logging (remove in production)
    console.log('User login debug:', {
      isNewUser,
      userName: user.name,
      needsProfileCompletion,
      provider: mappedProvider,
      providerId
    });
    
    if (needsProfileCompletion) {
      res.status(StatusCodes.OK).json({ 
        user: { id: user.id, name: user.name, email: user.email }, 
        token: jwt,
        needsProfileCompletion: true,
        message: 'Please complete your profile'
      });
    } else {
      res.status(StatusCodes.OK).json({ 
        user: { id: user.id, name: user.name, email: user.email }, 
        token: jwt,
        needsProfileCompletion: false
      });
    }
  } catch (err) {
    next(err);
  }
}

