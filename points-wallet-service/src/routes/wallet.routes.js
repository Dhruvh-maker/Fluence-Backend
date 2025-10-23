import { Router } from 'express';
import { verifyAuthToken } from '../middleware/auth.js';
import { WalletController } from '../controllers/wallet.controller.js';

const router = Router();

// All wallet routes require authentication
router.use(verifyAuthToken());

// Wallet balance routes
router.get('/balance', WalletController.getWalletBalance);
router.get('/balance/summary', WalletController.getWalletBalanceSummary);
router.get('/balance/history', WalletController.getWalletBalanceHistory);
router.get('/balance/trends', WalletController.getWalletBalanceTrends);
router.get('/balance/alerts', WalletController.getWalletBalanceAlerts);
router.get('/balance/date-range', WalletController.getWalletBalanceByDateRange);
router.get('/balance/transaction-type/:transactionType', WalletController.getWalletBalanceByTransactionType);
router.get('/balance/comparison/:comparisonUserId', WalletController.getWalletBalanceComparison);

// Wallet utility routes
router.post('/check-balance', WalletController.checkSufficientBalance);

export default router;
