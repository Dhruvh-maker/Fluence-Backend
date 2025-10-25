import express from 'express';
import { DisputeController } from '../controllers/dispute.controller.js';
import { verifyAuthToken } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const createDisputeValidation = [
  body('transactionId').isUUID().withMessage('Invalid transaction ID'),
  body('type').isIn(['chargeback', 'refund', 'fraud', 'other']).withMessage('Invalid dispute type'),
  body('reason').notEmpty().withMessage('Dispute reason is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number')
];

const updateDisputeValidation = [
  param('id').isUUID().withMessage('Invalid dispute ID'),
  body('status').optional().isIn(['open', 'under_review', 'resolved', 'closed']).withMessage('Invalid status'),
  body('reason').optional().notEmpty().withMessage('Dispute reason cannot be empty'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('resolution').optional().isString().withMessage('Resolution must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const disputeIdValidation = [
  param('id').isUUID().withMessage('Invalid dispute ID')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['open', 'under_review', 'resolved', 'closed']).withMessage('Invalid status'),
  query('type').optional().isIn(['chargeback', 'refund', 'fraud', 'other']).withMessage('Invalid dispute type')
];

const resolveDisputeValidation = [
  param('id').isUUID().withMessage('Invalid dispute ID'),
  body('resolution').notEmpty().withMessage('Resolution is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const analyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('status').optional().isIn(['open', 'under_review', 'resolved', 'closed']).withMessage('Invalid status')
];

// Routes
router.post('/', verifyAuthToken(), createDisputeValidation, DisputeController.createDispute);
router.get('/', verifyAuthToken(), queryValidation, DisputeController.getDisputes);
router.get('/analytics', verifyAuthToken(), analyticsValidation, DisputeController.getDisputeAnalytics);
router.get('/:id', verifyAuthToken(), disputeIdValidation, DisputeController.getDisputeById);
router.put('/:id', verifyAuthToken(), updateDisputeValidation, DisputeController.updateDispute);
router.delete('/:id', verifyAuthToken(), disputeIdValidation, DisputeController.deleteDispute);
router.post('/:id/resolve', verifyAuthToken(), resolveDisputeValidation, DisputeController.resolveDispute);

export default router;