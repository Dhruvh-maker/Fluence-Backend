import { getPool } from '../config/database.js';
import { ReferralLinkModel } from '../models/referral-link.model.js';
import { ReferralRewardModel } from '../models/referral-reward.model.js';

export class ReferralService {
  /**
   * Generate unique referral code
   */
  static generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get or create referral code for user
   */
  static async getOrCreateReferralCode(userId) {
    const pool = getPool();
    
    // Check if user already has an active referral code
    const existingLink = await ReferralLinkModel.getReferralLinksByReferrer(userId, 1, 0);
    
    if (existingLink.length > 0) {
      return {
        referralCode: existingLink[0].referral_code,
        isNew: false
      };
    }

    // Generate new referral code
    let referralCode;
    let isUnique = false;
    
    while (!isUnique) {
      referralCode = this.generateReferralCode();
      const existing = await ReferralLinkModel.getReferralLinkByCode(referralCode);
      if (!existing) {
        isUnique = true;
      }
    }

    // Create new referral link
    const referralLink = await ReferralLinkModel.createReferralLink(userId, referralCode);
    
    return {
      referralCode: referralLink.referral_code,
      isNew: true
    };
  }

  /**
   * Validate referral code
   */
  static async validateReferralCode(referralCode) {
    const referralLink = await ReferralLinkModel.getReferralLinkByCode(referralCode);
    
    if (!referralLink) {
      return {
        isValid: false,
        message: 'Invalid referral code'
      };
    }

    return {
      isValid: true,
      referrerId: referralLink.referrer_id,
      referralCode: referralLink.referral_code,
      createdAt: referralLink.created_at
    };
  }

  /**
   * Process referral when user signs up
   */
  static async processReferral(userId, referralCode) {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate referral code
      const validation = await this.validateReferralCode(referralCode);
      if (!validation.isValid) {
        throw new Error('Invalid referral code');
      }

      // Check if user is trying to refer themselves
      if (validation.referrerId === userId) {
        throw new Error('Cannot refer yourself');
      }

      // Get referral link
      const referralLink = await ReferralLinkModel.getReferralLinkByCode(referralCode);
      
      // Update referral link
      await ReferralLinkModel.updateReferralLinkStatus(
        referralLink.id, 
        'completed', 
        userId
      );

      // Create referral reward
      const reward = await ReferralRewardModel.createReferralReward({
        referrerId: referralLink.referrer_id,
        referredUserId: userId,
        referralLinkId: referralLink.id,
        rewardType: 'signup',
        pointsAmount: 100, // Default signup reward
        description: 'Referral signup reward'
      });

      await client.query('COMMIT');
      
      return {
        success: true,
        rewardId: reward.id,
        pointsAmount: reward.points_amount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get referral statistics for user
   */
  static async getReferralStats(userId) {
    const stats = await ReferralLinkModel.getReferralStats(userId);
    const rewardStats = await ReferralRewardModel.getReferralRewardStats(userId);
    
    return {
      totalReferrals: stats.total_referrals || 0,
      successfulReferrals: stats.successful_referrals || 0,
      totalPointsEarned: stats.total_points_earned || 0,
      totalRewards: rewardStats.total_rewards || 0,
      awardedRewards: rewardStats.awarded_rewards || 0,
      pendingRewards: rewardStats.pending_rewards || 0
    };
  }

  /**
   * Get referral links for user
   */
  static async getUserReferralLinks(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const links = await ReferralLinkModel.getReferralLinksByReferrer(userId, limit, offset);
    
    return {
      links,
      pagination: {
        page,
        limit,
        total: links.length
      }
    };
  }

  /**
   * Get referral leaderboard
   */
  static async getReferralLeaderboard(limit = 10) {
    return await ReferralLinkModel.getReferralLeaderboard(limit);
  }

  /**
   * Get referral rewards configuration
   */
  static getReferralRewards() {
    return {
      signup: 100,
      firstPurchase: 200,
      milestone: 500,
      bonus: 1000
    };
  }
}
