import { StatusCodes } from 'http-status-codes';
import { WalletBalanceModel } from '../models/wallet-balance.model.js';
import { PointsTransactionModel } from '../models/points-transaction.model.js';
import { ApiError } from '../middleware/error.js';

export class WalletController {
  /**
   * Get wallet balance for user
   */
  static async getWalletBalance(req, res, next) {
    try {
      const userId = req.user.id;
      
      let balance = await WalletBalanceModel.getBalanceByUserId(userId);
      
      // Create wallet balance if it doesn't exist
      if (!balance) {
        balance = await WalletBalanceModel.createWalletBalance(userId);
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          userId: balance.user_id,
          availableBalance: balance.available_balance,
          pendingBalance: balance.pending_balance,
          totalEarned: balance.total_earned,
          totalRedeemed: balance.total_redeemed,
          totalExpired: balance.total_expired,
          lastUpdated: balance.last_updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance summary
   */
  static async getWalletBalanceSummary(req, res, next) {
    try {
      const userId = req.user.id;
      
      const summary = await WalletBalanceModel.getWalletBalanceSummary(userId);
      
      if (!summary) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Wallet balance not found');
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance history
   */
  static async getWalletBalanceHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await WalletBalanceModel.getWalletBalanceHistory(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: history,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: history.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance trends
   */
  static async getWalletBalanceTrends(req, res, next) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;
      
      const trends = await WalletBalanceModel.getWalletBalanceTrends(
        userId, 
        parseInt(days)
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance alerts
   */
  static async getWalletBalanceAlerts(req, res, next) {
    try {
      const userId = req.user.id;
      
      const alerts = await WalletBalanceModel.getWalletBalanceAlerts(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user has sufficient balance
   */
  static async checkSufficientBalance(req, res, next) {
    try {
      const userId = req.user.id;
      const { requiredAmount } = req.body;
      
      if (!requiredAmount || requiredAmount <= 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid required amount is required');
      }
      
      const hasBalance = await PointsTransactionModel.hasSufficientBalance(
        userId, 
        requiredAmount
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          hasSufficientBalance: hasBalance,
          requiredAmount: parseInt(requiredAmount)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance by date range
   */
  static async getWalletBalanceByDateRange(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Start date and end date are required');
      }
      
      const balanceData = await WalletBalanceModel.getWalletBalanceByDateRange(
        userId, 
        startDate, 
        endDate
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: balanceData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance by transaction type
   */
  static async getWalletBalanceByTransactionType(req, res, next) {
    try {
      const userId = req.user.id;
      const { transactionType } = req.params;
      
      const balanceData = await WalletBalanceModel.getWalletBalanceByTransactionType(
        userId, 
        transactionType
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: balanceData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance comparison
   */
  static async getWalletBalanceComparison(req, res, next) {
    try {
      const userId = req.user.id;
      const { comparisonUserId } = req.params;
      
      const comparison = await WalletBalanceModel.getWalletBalanceComparison(
        userId, 
        comparisonUserId
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }
}
