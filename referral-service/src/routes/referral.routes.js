import { Router } from 'express';
import { verifyAuthToken, optionalAuth } from '../middleware/auth.js';
import { ReferralController } from '../controllers/referral.controller.js';

const router = Router();

// Referral code routes (require authentication)
router.use(verifyAuthToken());

// Referral code management
router.post('/code/generate', ReferralController.generateReferralCode);
router.post('/code/validate', ReferralController.validateReferralCode);
router.post('/complete', ReferralController.completeReferral);

// User referral data
router.get('/stats', ReferralController.getReferralStats);
router.get('/rewards', ReferralController.getReferralRewards);
router.get('/links', ReferralController.getReferralLinks);

// Public routes (optional authentication)
router.use(optionalAuth());

// Public referral data
router.get('/leaderboard', ReferralController.getReferralLeaderboard);
router.get('/campaigns', ReferralController.getReferralCampaigns);
router.get('/analytics', ReferralController.getReferralAnalytics);

export default router;
