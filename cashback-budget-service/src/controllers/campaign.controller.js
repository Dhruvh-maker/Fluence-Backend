import { CampaignModel } from '../models/campaign.model.js';
import { validationResult } from 'express-validator';

export class CampaignController {
  /**
   * Create a new campaign
   */
  static async createCampaign(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const campaignData = {
        ...req.body,
        userId: req.user.id
      };

      const campaign = await CampaignModel.create(campaignData);
      
      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create campaign',
        message: error.message
      });
    }
  }

  /**
   * Get all campaigns
   */
  static async getCampaigns(req, res) {
    try {
      const { page = 1, limit = 10, status, budgetId } = req.query;
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        budgetId
      };

      const campaigns = await CampaignModel.findAll(options);
      
      res.json({
        success: true,
        data: campaigns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: campaigns.length
        }
      });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaigns',
        message: error.message
      });
    }
  }

  /**
   * Get a specific campaign by ID
   */
  static async getCampaignById(req, res) {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaign',
        message: error.message
      });
    }
  }

  /**
   * Update a campaign
   */
  static async updateCampaign(req, res) {
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
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const updatedCampaign = await CampaignModel.update(id, req.body);
      
      res.json({
        success: true,
        data: updatedCampaign,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update campaign',
        message: error.message
      });
    }
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(req, res) {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      await CampaignModel.delete(id);
      
      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete campaign',
        message: error.message
      });
    }
  }

  /**
   * Activate a campaign
   */
  static async activateCampaign(req, res) {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const activatedCampaign = await CampaignModel.activate(id);
      
      res.json({
        success: true,
        data: activatedCampaign,
        message: 'Campaign activated successfully'
      });
    } catch (error) {
      console.error('Error activating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to activate campaign',
        message: error.message
      });
    }
  }

  /**
   * Deactivate a campaign
   */
  static async deactivateCampaign(req, res) {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const deactivatedCampaign = await CampaignModel.deactivate(id);
      
      res.json({
        success: true,
        data: deactivatedCampaign,
        message: 'Campaign deactivated successfully'
      });
    } catch (error) {
      console.error('Error deactivating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deactivate campaign',
        message: error.message
      });
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(req, res) {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const analytics = await CampaignModel.getAnalytics(id);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaign analytics',
        message: error.message
      });
    }
  }
}