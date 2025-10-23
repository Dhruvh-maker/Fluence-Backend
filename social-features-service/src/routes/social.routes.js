import { Router } from 'express';
import { verifyAuthToken, optionalAuth } from '../middleware/auth.js';
import { SocialController } from '../controllers/social.controller.js';

const router = Router();

// Social account routes (require authentication)
router.use(verifyAuthToken());

// Social account management
router.post('/accounts/connect', SocialController.connectSocialAccount);
router.get('/accounts', SocialController.getSocialAccounts);
router.delete('/accounts/:accountId', SocialController.disconnectSocialAccount);

// Social post management
router.post('/posts', SocialController.createSocialPost);
router.get('/posts', SocialController.getSocialPosts);
router.put('/posts/:postId', SocialController.updateSocialPost);
router.delete('/posts/:postId', SocialController.deleteSocialPost);

// Social analytics and rewards
router.get('/analytics', SocialController.getSocialAnalytics);
router.get('/rewards', SocialController.getSocialRewards);

// Merchant reports and insights
router.get('/merchant/reports', SocialController.getMerchantReports);
router.get('/merchant/influencer-scoring', SocialController.getInfluencerScoring);
router.get('/merchant/analytics', SocialController.getMerchantAnalytics);

// Social settings
router.get('/settings', SocialController.getSocialSettings);
router.put('/settings', SocialController.updateSocialSettings);

// Public routes (optional authentication)
router.use(optionalAuth());

// Public social data
router.get('/campaigns', SocialController.getSocialCampaigns);
router.get('/platforms', SocialController.getSocialPlatforms);
router.get('/influencer-ranking', SocialController.getInfluencerRanking);

export default router;
