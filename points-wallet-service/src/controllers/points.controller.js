import { StatusCodes } from 'http-status-codes';
import { PointsTransactionModel } from '../models/points-transaction.model.js';
import { ApiError } from '../middleware/error.js';

export class PointsController {
  /**
   * Earn points for user
   */
  static async earnPoints(req, res, next) {
    try {
      const userId = req.user.id;
      const { 
        amount, 
        transactionType, 
        description, 
        referenceId,
        socialPostRequired = false,
        timeBufferEndsAt = null,
        expiresAt = null
      } = req.body;
      
      if (!amount || amount <= 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid amount is required');
      }
      
      if (!transactionType) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Transaction type is required');
      }
      
      const transaction = await PointsTransactionModel.createTransaction({
        userId,
        amount,
        transactionType,
        description,
        referenceId,
        socialPostRequired,
        timeBufferEndsAt,
        expiresAt
      });
      
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: transaction,
        message: 'Points earned successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's points transactions
   */
  static async getPointsTransactions(req, res, next) {
    try {
      const userId = req.user.id;
      const { 
        limit = 50, 
        offset = 0, 
        transactionType, 
        status, 
        startDate, 
        endDate 
      } = req.query;
      
      const filters = {
        transactionType,
        status,
        startDate,
        endDate
      };
      
      const transactions = await PointsTransactionModel.getTransactionsByUserId(
        userId, 
        parseInt(limit), 
        parseInt(offset), 
        filters
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: transactions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get points transaction by ID
   */
  static async getPointsTransactionById(req, res, next) {
    try {
      const { transactionId } = req.params;
      
      const transaction = await PointsTransactionModel.getTransactionById(transactionId);
      
      if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(req, res, next) {
    try {
      const { transactionId } = req.params;
      const { status, processedAt } = req.body;
      
      if (!status) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Status is required');
      }
      
      const transaction = await PointsTransactionModel.updateTransactionStatus(
        transactionId, 
        status, 
        processedAt
      );
      
      if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction,
        message: 'Transaction status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update social post status
   */
  static async updateSocialPostStatus(req, res, next) {
    try {
      const { transactionId } = req.params;
      const { socialPostMade, socialPostUrl, socialPostVerified } = req.body;
      
      const transaction = await PointsTransactionModel.updateSocialPostStatus(
        transactionId, 
        socialPostMade, 
        socialPostUrl, 
        socialPostVerified
      );
      
      if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction,
        message: 'Social post status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions requiring social posts
   */
  static async getTransactionsRequiringSocialPosts(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const transactions = await PointsTransactionModel.getTransactionsRequiringSocialPosts(
        userId, 
        parseInt(limit), 
        parseInt(offset)
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transactions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: transactions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions in time buffer
   */
  static async getTransactionsInTimeBuffer(req, res, next) {
    try {
      const userId = req.user.id;
      
      const transactions = await PointsTransactionModel.getTransactionsInTimeBuffer(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get points transaction statistics
   */
  static async getPointsTransactionStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      const stats = await PointsTransactionModel.getTransactionStats(
        userId, 
        startDate, 
        endDate
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get daily transaction summary
   */
  static async getDailyTransactionSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Start date and end date are required');
      }
      
      const summary = await PointsTransactionModel.getDailyTransactionSummary(
        userId, 
        startDate, 
        endDate
      );
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total points earned
   */
  static async getTotalPointsEarned(req, res, next) {
    try {
      const userId = req.user.id;
      
      const totalEarned = await PointsTransactionModel.getTotalPointsEarned(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          totalEarned
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get total points redeemed
   */
  static async getTotalPointsRedeemed(req, res, next) {
    try {
      const userId = req.user.id;
      
      const totalRedeemed = await PointsTransactionModel.getTotalPointsRedeemed(userId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: {
          totalRedeemed
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions by reference ID
   */
  static async getTransactionsByReferenceId(req, res, next) {
    try {
      const { referenceId } = req.params;
      
      const transactions = await PointsTransactionModel.getTransactionsByReferenceId(referenceId);
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete transaction (only if pending)
   */
  static async deleteTransaction(req, res, next) {
    try {
      const userId = req.user.id;
      const { transactionId } = req.params;
      
      const transaction = await PointsTransactionModel.deleteTransaction(transactionId, userId);
      
      if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found or cannot be deleted');
      }
      
      res.status(StatusCodes.OK).json({
        success: true,
        data: transaction,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
