import express from 'express';
import { CampaignController } from '../controllers/campaign.controller.js';
import { verifyAuthToken } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const createCampaignValidation = [
  body('name').notEmpty().withMessage('Campaign name is required'),
  body('budgetId').isUUID().withMessage('Invalid budget ID'),
  body('cashbackPercentage').isFloat({ min: 0, max: 100 }).withMessage('Cashback percentage must be between 0 and 100'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('description').optional().isString().withMessage('Description must be a string')
];

const updateCampaignValidation = [
  param('id').isUUID().withMessage('Invalid campaign ID'),
  body('name').optional().notEmpty().withMessage('Campaign name cannot be empty'),
  body('cashbackPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Cashback percentage must be between 0 and 100'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('description').optional().isString().withMessage('Description must be a string')
];

const campaignIdValidation = [
  param('id').isUUID().withMessage('Invalid campaign ID')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'completed']).withMessage('Invalid status'),
  query('budgetId').optional().isUUID().withMessage('Invalid budget ID')
];

// Routes
router.post('/', verifyAuthToken(), createCampaignValidation, CampaignController.createCampaign);
// router.get('/', verifyAuthToken(), queryValidation, CampaignController.getCampaigns);
router.get('/', queryValidation, CampaignController.getCampaigns);
router.get('/:id', verifyAuthToken(), campaignIdValidation, CampaignController.getCampaignById);
router.put('/:id', verifyAuthToken(), updateCampaignValidation, CampaignController.updateCampaign);
router.delete('/:id', verifyAuthToken(), campaignIdValidation, CampaignController.deleteCampaign);
router.post('/:id/activate', verifyAuthToken(), campaignIdValidation, CampaignController.activateCampaign);
router.post('/:id/deactivate', verifyAuthToken(), campaignIdValidation, CampaignController.deactivateCampaign);
router.get('/:id/analytics', verifyAuthToken(), campaignIdValidation, CampaignController.getCampaignAnalytics);

export default router;