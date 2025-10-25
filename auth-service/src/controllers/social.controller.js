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

    // Debug: Log user data before JWT generation
    console.log('🔐 Generating JWT for user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const jwt = signToken({ sub: user.id, email: user.email, role: user.role });

    // Debug: Decode and log the JWT payload
    const jwtPayload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    console.log('📝 JWT Payload generated:', JSON.stringify(jwtPayload, null, 2));

    // Check if user needs to complete profile (new user or has placeholder name)
    // But first check if they already have a merchant application
    let needsProfileCompletion = isNewUser || user.name === 'New User';

    // If user seems to need profile completion, check if they already have a merchant application
    if (needsProfileCompletion) {
      try {
        // Check merchant service for existing applications
        const merchantServiceUrl = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';
        const response = await fetch(`${merchantServiceUrl}/api/applications`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // If user has applications, they don't need profile completion
          if (data.success && data.data && data.data.length > 0) {
            needsProfileCompletion = false;
            console.log('🔍 User has existing merchant applications, skipping profile completion');
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not check merchant applications:', error.message);
        // Continue with original logic if merchant service is unavailable
      }
    }

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
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: jwt,
        needsProfileCompletion: true,
        message: 'Please complete your profile'
      });
    } else {
      res.status(StatusCodes.OK).json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token: jwt,
        needsProfileCompletion: false
      });
    }
  } catch (err) {
    next(err);
  }
}

