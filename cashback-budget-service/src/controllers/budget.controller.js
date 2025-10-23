import { BudgetModel } from '../models/budget.model.js';
import { validationResult } from 'express-validator';

export class BudgetController {
  /**
   * Create a new budget
   */
  static async createBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const budgetData = {
        ...req.body,
        userId: req.user.id
      };

      const budget = await BudgetModel.create(budgetData);
      
      res.status(201).json({
        success: true,
        data: budget,
        message: 'Budget created successfully'
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create budget',
        message: error.message
      });
    }
  }

  /**
   * Get all budgets for a user
   */
  static async getUserBudgets(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      };

      const budgets = await BudgetModel.findByUserId(req.user.id, options);
      
      res.json({
        success: true,
        data: budgets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: budgets.length
        }
      });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch budgets',
        message: error.message
      });
    }
  }

  /**
   * Get a specific budget by ID
   */
  static async getBudgetById(req, res) {
    try {
      const { id } = req.params;
      const budget = await BudgetModel.findById(id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }

      // Check if user owns this budget
      if (budget.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch budget',
        message: error.message
      });
    }
  }

  /**
   * Update a budget
   */
  static async updateBudget(req, res) {
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
      const budget = await BudgetModel.findById(id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }

      // Check if user owns this budget
      if (budget.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const updatedBudget = await BudgetModel.update(id, req.body);
      
      res.json({
        success: true,
        data: updatedBudget,
        message: 'Budget updated successfully'
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update budget',
        message: error.message
      });
    }
  }

  /**
   * Delete a budget
   */
  static async deleteBudget(req, res) {
    try {
      const { id } = req.params;
      const budget = await BudgetModel.findById(id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }

      // Check if user owns this budget
      if (budget.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await BudgetModel.delete(id);
      
      res.json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete budget',
        message: error.message
      });
    }
  }

  /**
   * Get budget analytics
   */
  static async getBudgetAnalytics(req, res) {
    try {
      const { id } = req.params;
      const budget = await BudgetModel.findById(id);

      if (!budget) {
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }

      // Check if user owns this budget
      if (budget.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      const analytics = await BudgetModel.getAnalytics(id);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching budget analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch budget analytics',
        message: error.message
      });
    }
  }
}