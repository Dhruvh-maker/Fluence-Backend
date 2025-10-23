import { getPool } from '../config/database.js';

export class MerchantProfileModel {
  /**
   * Get merchant profile by ID
   */
  static async getProfileById(profileId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM merchant_profiles WHERE id = $1',
      [profileId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get merchant profile by user ID
   */
  static async getProfileByUserId(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM merchant_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all merchant profiles with pagination
   */
  static async getAllProfiles(limit = 50, offset = 0, status = null) {
    const pool = getPool();
    let query = 'SELECT * FROM merchant_profiles';
    let params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` WHERE status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update merchant profile
   */
  static async updateProfile(profileId, updateData) {
    const pool = getPool();
    const {
      businessName,
      businessType,
      contactPerson,
      email,
      phone,
      businessAddress,
      businessLicense,
      taxId,
      bankAccountDetails
    } = updateData;

    const result = await pool.query(
      `UPDATE merchant_profiles 
       SET business_name = $2, business_type = $3, contact_person = $4,
           email = $5, phone = $6, business_address = $7, business_license = $8,
           tax_id = $9, bank_account_details = $10, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        profileId, businessName, businessType, contactPerson, email.toLowerCase(),
        phone, businessAddress, businessLicense, taxId, bankAccountDetails
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Update merchant profile status
   */
  static async updateProfileStatus(profileId, status, updatedBy = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE merchant_profiles 
       SET status = $2, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [profileId, status]
    );
    return result.rows[0] || null;
  }

  /**
   * Get merchant profile with application details
   */
  static async getProfileWithApplication(profileId) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         mp.*,
         ma.business_license as original_business_license,
         ma.tax_id as original_tax_id,
         ma.bank_account_details as original_bank_details,
         ma.submitted_at,
         ma.reviewed_at,
         ma.reviewed_by
       FROM merchant_profiles mp
       LEFT JOIN merchant_applications ma ON mp.application_id = ma.id
       WHERE mp.id = $1`,
      [profileId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get merchant profile by application ID
   */
  static async getProfileByApplicationId(applicationId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM merchant_profiles WHERE application_id = $1',
      [applicationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get active merchant profiles
   */
  static async getActiveProfiles(limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM merchant_profiles 
       WHERE status = 'active' 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Get merchant profile statistics
   */
  static async getProfileStats() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         status,
         COUNT(*) as count,
         business_type,
         COUNT(*) as type_count
       FROM merchant_profiles 
       GROUP BY status, business_type
       ORDER BY status, type_count DESC`
    );
    return result.rows;
  }

  /**
   * Search merchant profiles
   */
  static async searchProfiles(searchTerm, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM merchant_profiles 
       WHERE business_name ILIKE $1 
       OR contact_person ILIKE $1 
       OR email ILIKE $1
       ORDER BY business_name ASC 
       LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get merchant profiles by business type
   */
  static async getProfilesByBusinessType(businessType, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM merchant_profiles 
       WHERE business_type = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [businessType, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get merchant profile count by status
   */
  static async getProfileCountByStatus() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM merchant_profiles 
       GROUP BY status`
    );
    return result.rows;
  }

  /**
   * Check if merchant profile exists for user
   */
  static async hasProfile(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM merchant_profiles WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get merchant profile with recent activity
   */
  static async getProfileWithActivity(profileId, days = 30) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         mp.*,
         COUNT(ma.id) as total_applications,
         MAX(ma.submitted_at) as last_application_date
       FROM merchant_profiles mp
       LEFT JOIN merchant_applications ma ON mp.user_id = ma.user_id
       WHERE mp.id = $1
       GROUP BY mp.id`,
      [profileId]
    );
    return result.rows[0] || null;
  }
}
