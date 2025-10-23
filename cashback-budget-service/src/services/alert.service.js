import { BudgetModel } from '../models/budget.model.js';
import { CampaignModel } from '../models/campaign.model.js';
import { getConfig } from '../config/index.js';

export class AlertService {
  /**
   * Check budget thresholds and send alerts
   */
  static async checkBudgetThresholds(merchantId) {
    const budget = await BudgetModel.getBudgetByMerchantId(merchantId);
    if (!budget || budget.status !== 'active') {
      return { alerts: [] };
    }

    const utilization = await BudgetModel.getBudgetUtilization(budget.id);
    const alerts = [];

    // Check 60% threshold
    if (utilization.utilization_percentage >= 60 && utilization.utilization_percentage < 100) {
      const alert = await this.createBudgetAlert({
        merchantId,
        budgetId: budget.id,
        alertType: 'threshold_reached',
        thresholdPercentage: 60.00,
        currentPercentage: utilization.utilization_percentage,
        message: `Budget utilization has reached ${utilization.utilization_percentage.toFixed(2)}%`
      });
      alerts.push(alert);
    }

    // Check 50% auto-stop threshold
    if (utilization.utilization_percentage >= 50) {
      const alert = await this.createBudgetAlert({
        merchantId,
        budgetId: budget.id,
        alertType: 'auto_stop_triggered',
        thresholdPercentage: 50.00,
        currentPercentage: utilization.utilization_percentage,
        message: `Budget utilization has reached ${utilization.utilization_percentage.toFixed(2)}% - Auto-stop triggered`
      });
      alerts.push(alert);

      // Pause active campaigns
      await this.pauseActiveCampaigns(merchantId);
    }

    return { alerts };
  }

  /**
   * Create budget alert
   */
  static async createBudgetAlert(alertData) {
    const pool = await import('../config/database.js').then(m => m.getPool());
    const {
      merchantId,
      budgetId,
      alertType,
      thresholdPercentage,
      currentPercentage,
      message
    } = alertData;

    const result = await pool.query(
      `INSERT INTO budget_alerts (
        merchant_id, budget_id, alert_type, threshold_percentage,
        current_percentage, message
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        merchantId, budgetId, alertType, thresholdPercentage,
        currentPercentage, message
      ]
    );
    return result.rows[0];
  }

  /**
   * Pause active campaigns when budget threshold is reached
   */
  static async pauseActiveCampaigns(merchantId) {
    const activeCampaigns = await CampaignModel.getActiveCampaignsByMerchantId(merchantId);
    const pausedCampaigns = [];

    for (const campaign of activeCampaigns) {
      await CampaignModel.updateCampaignStatus(campaign.id, 'paused');
      pausedCampaigns.push(campaign);
    }

    return pausedCampaigns;
  }

  /**
   * Resume campaigns when budget is reloaded
   */
  static async resumeCampaigns(merchantId) {
    const pausedCampaigns = await CampaignModel.getCampaignsByMerchantId(merchantId);
    const resumedCampaigns = [];

    for (const campaign of pausedCampaigns) {
      if (campaign.status === 'paused' && new Date(campaign.end_date) > new Date()) {
        await CampaignModel.updateCampaignStatus(campaign.id, 'active');
        resumedCampaigns.push(campaign);
      }
    }

    return resumedCampaigns;
  }

  /**
   * Check for campaigns ending soon
   */
  static async checkCampaignsEndingSoon(days = 7) {
    const campaigns = await CampaignModel.getCampaignsEndingSoon(days);
    const alerts = [];

    for (const campaign of campaigns) {
      const alert = await this.createCampaignAlert({
        merchantId: campaign.merchant_id,
        campaignId: campaign.id,
        alertType: 'campaign_ending_soon',
        message: `Campaign "${campaign.campaign_name}" is ending in ${days} days`
      });
      alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Create campaign alert
   */
  static async createCampaignAlert(alertData) {
    const pool = await import('../config/database.js').then(m => m.getPool());
    const {
      merchantId,
      campaignId,
      alertType,
      message
    } = alertData;

    const result = await pool.query(
      `INSERT INTO budget_alerts (
        merchant_id, budget_id, alert_type, threshold_percentage,
        current_percentage, message
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        merchantId, campaignId, alertType, 0.00, 0.00, message
      ]
    );
    return result.rows[0];
  }

  /**
   * Auto-complete expired campaigns
   */
  static async autoCompleteExpiredCampaigns() {
    const expiredCampaigns = await CampaignModel.getExpiredCampaigns();
    const completedCampaigns = [];

    for (const campaign of expiredCampaigns) {
      await CampaignModel.updateCampaignStatus(campaign.id, 'completed');
      completedCampaigns.push(campaign);
    }

    return completedCampaigns;
  }

  /**
   * Get merchant alerts
   */
  static async getMerchantAlerts(merchantId, limit = 50, offset = 0) {
    return await BudgetModel.getBudgetAlerts(merchantId, limit, offset);
  }

  /**
   * Acknowledge alert
   */
  static async acknowledgeAlert(alertId) {
    return await BudgetModel.acknowledgeBudgetAlert(alertId);
  }

  /**
   * Send budget low alert
   */
  static async sendBudgetLowAlert(merchantId) {
    const budget = await BudgetModel.getBudgetByMerchantId(merchantId);
    if (!budget) return null;

    const utilization = await BudgetModel.getBudgetUtilization(budget.id);
    
    if (utilization.utilization_percentage >= 80) {
      return await this.createBudgetAlert({
        merchantId,
        budgetId: budget.id,
        alertType: 'budget_low',
        thresholdPercentage: 80.00,
        currentPercentage: utilization.utilization_percentage,
        message: `Budget is running low at ${utilization.utilization_percentage.toFixed(2)}% utilization`
      });
    }

    return null;
  }

  /**
   * Check all merchants for alerts
   */
  static async checkAllMerchantsForAlerts() {
    const pool = await import('../config/database.js').then(m => m.getPool());
    const result = await pool.query(
      `SELECT DISTINCT merchant_id FROM merchant_budgets WHERE status = 'active'`
    );
    
    const allAlerts = [];
    
    for (const row of result.rows) {
      try {
        const alerts = await this.checkBudgetThresholds(row.merchant_id);
        allAlerts.push(...alerts.alerts);
      } catch (error) {
        console.error(`Failed to check alerts for merchant ${row.merchant_id}:`, error);
      }
    }

    return allAlerts;
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(merchantId = null) {
    const pool = await import('../config/database.js').then(m => m.getPool());
    let query = `
      SELECT 
        alert_type,
        COUNT(*) as count,
        COUNT(CASE WHEN acknowledged_at IS NOT NULL THEN 1 END) as acknowledged_count
      FROM budget_alerts
    `;
    const params = [];
    
    if (merchantId) {
      query += ' WHERE merchant_id = $1';
      params.push(merchantId);
    }
    
    query += ' GROUP BY alert_type ORDER BY alert_type';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get unacknowledged alerts
   */
  static async getUnacknowledgedAlerts(merchantId = null, limit = 50, offset = 0) {
    const pool = await import('../config/database.js').then(m => m.getPool());
    let query = `
      SELECT * FROM budget_alerts 
      WHERE acknowledged_at IS NULL
    `;
    const params = [];
    let paramCount = 0;

    if (merchantId) {
      paramCount++;
      query += ` AND merchant_id = $${paramCount}`;
      params.push(merchantId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Bulk acknowledge alerts
   */
  static async bulkAcknowledgeAlerts(alertIds) {
    const pool = await import('../config/database.js').then(m => m.getPool());
    const result = await pool.query(
      `UPDATE budget_alerts 
       SET acknowledged_at = NOW()
       WHERE id = ANY($1) RETURNING *`,
      [alertIds]
    );
    return result.rows;
  }
}
