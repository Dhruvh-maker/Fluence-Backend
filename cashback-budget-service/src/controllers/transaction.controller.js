import { TransactionModel } from '../models/transaction.model.js';
import { validationResult } from 'express-validator';

export class TransactionController {
  /**
   * Create a new transaction
   */
  static async createTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const transactionData = {
        ...req.body,
        userId: req.user.id
      };

      const transaction = await TransactionModel.create(transactionData);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully'
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create transaction',
        message: error.message
      });
    }
  }

  /**
   * Get all transactions
   */
  static async getTransactions(req, res) {
    try {
      const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        startDate,
        endDate
      };

      const transactions = await TransactionModel.findAll(options);
      
      res.json({
        success: true,
        data: transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions',
        message: error.message
      });
    }
  }

  /**
   * Get a specific transaction by ID
   */
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transaction',
        message: error.message
      });
    }
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      const updatedTransaction = await TransactionModel.update(id, req.body);
      
      res.json({
        success: true,
        data: updatedTransaction,
        message: 'Transaction updated successfully'
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update transaction',
        message: error.message
      });
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      await TransactionModel.delete(id);
      
      res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete transaction',
        message: error.message
      });
    }
  }

  /**
   * Process a transaction
   */
  static async processTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      const processedTransaction = await TransactionModel.process(id);
      
      res.json({
        success: true,
        data: processedTransaction,
        message: 'Transaction processed successfully'
      });
    } catch (error) {
      console.error('Error processing transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process transaction',
        message: error.message
      });
    }
  }

  /**
   * Get transaction analytics
   */
  static async getTransactionAnalytics(req, res) {
    try {
      const { startDate, endDate, type } = req.query;
      const options = {
        startDate,
        endDate,
        type
      };

      const analytics = await TransactionModel.getAnalytics(options);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching transaction analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transaction analytics',
        message: error.message
      });
    }
  }
}