import { DisputeModel } from '../models/dispute.model.js';
import { validationResult } from 'express-validator';

export class DisputeController {
  /**
   * Create a new dispute
   */
  static async createDispute(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const disputeData = {
        ...req.body,
        userId: req.user.id
      };

      const dispute = await DisputeModel.create(disputeData);
      
      res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute created successfully'
      });
    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create dispute',
        message: error.message
      });
    }
  }

  /**
   * Get all disputes
   */
  static async getDisputes(req, res) {
    try {
      const { page = 1, limit = 10, status, type } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type
      };

      const disputes = await DisputeModel.findAll(options);
      
      res.json({
        success: true,
        data: disputes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: disputes.length
        }
      });
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch disputes',
        message: error.message
      });
    }
  }

  /**
   * Get a specific dispute by ID
   */
  static async getDisputeById(req, res) {
    try {
      const { id } = req.params;
      const dispute = await DisputeModel.findById(id);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found'
        });
      }

      res.json({
        success: true,
        data: dispute
      });
    } catch (error) {
      console.error('Error fetching dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dispute',
        message: error.message
      });
    }
  }

  /**
   * Update a dispute
   */
  static async updateDispute(req, res) {
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
      const dispute = await DisputeModel.findById(id);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found'
        });
      }

      const updatedDispute = await DisputeModel.update(id, req.body);
      
      res.json({
        success: true,
        data: updatedDispute,
        message: 'Dispute updated successfully'
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update dispute',
        message: error.message
      });
    }
  }

  /**
   * Delete a dispute
   */
  static async deleteDispute(req, res) {
    try {
      const { id } = req.params;
      const dispute = await DisputeModel.findById(id);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found'
        });
      }

      await DisputeModel.delete(id);
      
      res.json({
        success: true,
        message: 'Dispute deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete dispute',
        message: error.message
      });
    }
  }

  /**
   * Resolve a dispute
   */
  static async resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { resolution, notes } = req.body;
      
      const dispute = await DisputeModel.findById(id);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found'
        });
      }

      const resolvedDispute = await DisputeModel.resolve(id, resolution, notes);
      
      res.json({
        success: true,
        data: resolvedDispute,
        message: 'Dispute resolved successfully'
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve dispute',
        message: error.message
      });
    }
  }

  /**
   * Get dispute analytics
   */
  static async getDisputeAnalytics(req, res) {
    try {
      const { startDate, endDate, status } = req.query;
      const options = {
        startDate,
        endDate,
        status
      };

      const analytics = await DisputeModel.getAnalytics(options);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching dispute analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dispute analytics',
        message: error.message
      });
    }
  }
}