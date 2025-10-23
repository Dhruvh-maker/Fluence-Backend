import { Router } from 'express';
import { loginWithFirebase } from '../controllers/social.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { updateAccountStatus } from '../controllers/account.controller.js';
import { completeProfile } from '../controllers/profile.controller.js';

const router = Router();

// Firebase-only auth endpoint
router.post('/firebase', loginWithFirebase);
router.post('/complete-profile', requireAuth(['active','paused']), completeProfile);
router.post('/account/status', requireAuth(['active','paused']), updateAccountStatus);

export default router;

