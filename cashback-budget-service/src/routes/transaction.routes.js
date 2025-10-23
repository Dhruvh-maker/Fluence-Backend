import express from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { verifyAuthToken } from '../middleware/auth.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const createTransactionValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['cashback', 'payment', 'refund']).withMessage('Invalid transaction type'),
  body('campaignId').optional().isUUID().withMessage('Invalid campaign ID'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const updateTransactionValidation = [
  param('id').isUUID().withMessage('Invalid transaction ID'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('type').optional().isIn(['cashback', 'payment', 'refund']).withMessage('Invalid transaction type'),
  body('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

const transactionIdValidation = [
  param('id').isUUID().withMessage('Invalid transaction ID')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  query('type').optional().isIn(['cashback', 'payment', 'refund']).withMessage('Invalid transaction type'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
];

const analyticsValidation = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  query('type').optional().isIn(['cashback', 'payment', 'refund']).withMessage('Invalid transaction type')
];

// Routes
router.post('/', verifyAuthToken, createTransactionValidation, TransactionController.createTransaction);
router.get('/', verifyAuthToken, queryValidation, TransactionController.getTransactions);
router.get('/analytics', verifyAuthToken, analyticsValidation, TransactionController.getTransactionAnalytics);
router.get('/:id', verifyAuthToken, transactionIdValidation, TransactionController.getTransactionById);
router.put('/:id', verifyAuthToken, updateTransactionValidation, TransactionController.updateTransaction);
router.delete('/:id', verifyAuthToken, transactionIdValidation, TransactionController.deleteTransaction);
router.post('/:id/process', verifyAuthToken, transactionIdValidation, TransactionController.processTransaction);

export default router;