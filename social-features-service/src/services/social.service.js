import { SocialAccountModel } from '../models/social-account.model.js';
import { SocialPostModel } from '../models/social-post.model.js';

export class SocialService {
  /**
   * Connect social account
   */
  static async connectSocialAccount(userId, accountData) {
    const {
      platformId,
      platformUserId,
      username,
      displayName,
      profilePictureUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt
    } = accountData;

    // Check if account already exists
    const existingAccount = await SocialAccountModel.getSocialAccountByPlatform(userId, platformId);
    
    if (existingAccount) {
      // Update existing account
      return await SocialAccountModel.updateSocialAccount(existingAccount.id, {
        username,
        displayName,
        profilePictureUrl,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        isConnected: true
      });
    }

    // Create new account
    return await SocialAccountModel.createSocialAccount({
      userId,
      platformId,
      platformUserId,
      username,
      displayName,
      profilePictureUrl,
      accessToken,
      refreshToken,
      tokenExpiresAt
    });
  }

  /**
   * Disconnect social account
   */
  static async disconnectSocialAccount(userId, accountId) {
    return await SocialAccountModel.disconnectSocialAccount(accountId, userId);
  }

  /**
   * Get user's social accounts
   */
  static async getSocialAccounts(userId) {
    return await SocialAccountModel.getSocialAccountsByUser(userId);
  }

  /**
   * Create social post
   */
  static async createSocialPost(userId, postData) {
    const {
      socialAccountId,
      content,
      mediaUrls,
      postType,
      scheduledAt
    } = postData;

    // Verify social account belongs to user
    const account = await SocialAccountModel.getSocialAccountById(socialAccountId);
    if (!account || account.user_id !== userId) {
      throw new Error('Social account not found or does not belong to user');
    }

    return await SocialPostModel.createSocialPost({
      userId,
      socialAccountId,
      content,
      mediaUrls,
      postType,
      scheduledAt
    });
  }

  /**
   * Get user's social posts
   */
  static async getSocialPosts(userId, filters = {}) {
    const { limit = 50, offset = 0, status, postType } = filters;
    return await SocialPostModel.getSocialPostsByUser(userId, limit, offset, { status, postType });
  }

  /**
   * Update social post
   */
  static async updateSocialPost(userId, postId, updateData) {
    const post = await SocialPostModel.getSocialPostById(postId);
    if (!post || post.user_id !== userId) {
      throw new Error('Social post not found or does not belong to user');
    }

    return await SocialPostModel.updateSocialPost(postId, updateData);
  }

  /**
   * Delete social post
   */
  static async deleteSocialPost(userId, postId) {
    return await SocialPostModel.deleteSocialPost(postId, userId);
  }

  /**
   * Get social analytics
   */
  static async getSocialAnalytics(userId, filters = {}) {
    const { startDate, endDate, platformId } = filters;
    
    // This would typically involve complex analytics queries
    // For now, return basic post statistics
    const postStats = await SocialPostModel.getSocialPostStats(userId);
    const accountStats = await SocialAccountModel.getSocialAccountStats(userId);
    
    return {
      posts: postStats,
      accounts: accountStats,
      period: { startDate, endDate, platformId }
    };
  }

  /**
   * Get social rewards
   */
  static async getSocialRewards(userId, limit = 50, offset = 0) {
    // This would integrate with the points system
    // For now, return empty array
    return [];
  }

  /**
   * Get social campaigns
   */
  static async getSocialCampaigns() {
    // This would return active social campaigns
    // For now, return empty array
    return [];
  }

  /**
   * Get social platforms
   */
  static async getSocialPlatforms() {
    // This would return available social platforms
    // For now, return basic platforms
    return [
      { id: '1', name: 'facebook', display_name: 'Facebook', is_active: true },
      { id: '2', name: 'twitter', display_name: 'Twitter', is_active: true },
      { id: '3', name: 'instagram', display_name: 'Instagram', is_active: true },
      { id: '4', name: 'linkedin', display_name: 'LinkedIn', is_active: true },
      { id: '5', name: 'tiktok', display_name: 'TikTok', is_active: true }
    ];
  }

  /**
   * Update social settings
   */
  static async updateSocialSettings(userId, settings) {
    // This would update user's social preferences
    // For now, return the settings
    return {
      userId,
      ...settings,
      updatedAt: new Date()
    };
  }

  /**
   * Get social settings
   */
  static async getSocialSettings(userId) {
    // This would return user's social settings
    // For now, return default settings
    return {
      userId,
      autoPostEnabled: false,
      autoShareEnabled: false,
      notificationEnabled: true,
      privacyLevel: 'public',
      contentFilters: [],
      preferredPlatforms: []
    };
  }
}
