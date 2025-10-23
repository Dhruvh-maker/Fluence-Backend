import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import { MerchantProfileModel } from '../models/merchant-profile.model.js';

// Validation schemas
const profileUpdateSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  businessType: z.enum(['retail', 'restaurant', 'service', 'ecommerce', 'other']).optional(),
  contactPerson: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().min(1).max(20).optional(),
  businessAddress: z.string().min(1).optional(),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  bankAccountDetails: z.object({
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    routingNumber: z.string().optional()
  }).optional()
});

const paginationSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

/**
 * Get merchant profile
 */
export async function getMerchantProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const profile = await MerchantProfileModel.getProfileByUserId(userId);
    
    if (!profile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Merchant profile not found');
    }

    // Get profile with application details
    const profileWithDetails = await MerchantProfileModel.getProfileWithApplication(profile.id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profileWithDetails
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update merchant profile
 */
export async function updateMerchantProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const updateData = profileUpdateSchema.parse(req.body);

    const profile = await MerchantProfileModel.getProfileByUserId(userId);
    
    if (!profile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Merchant profile not found');
    }

    if (profile.status !== 'active') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot update inactive profile');
    }

    const updatedProfile = await MerchantProfileModel.updateProfile(profile.id, updateData);

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid profile data', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get merchant profile by ID (admin only)
 */
export async function getMerchantProfileById(req, res, next) {
  try {
    const { profileId } = req.params;

    const profile = await MerchantProfileModel.getProfileById(profileId);
    
    if (!profile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Merchant profile not found');
    }

    // Get profile with application details
    const profileWithDetails = await MerchantProfileModel.getProfileWithApplication(profileId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profileWithDetails
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all merchant profiles (admin only)
 */
export async function getAllMerchantProfiles(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const status = req.query.status;

    const profiles = await MerchantProfileModel.getAllProfiles(limit, offset, status);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profiles,
      pagination: {
        limit,
        offset,
        hasMore: profiles.length === limit
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get active merchant profiles
 */
export async function getActiveMerchantProfiles(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);

    const profiles = await MerchantProfileModel.getActiveProfiles(limit, offset);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profiles,
      pagination: {
        limit,
        offset,
        hasMore: profiles.length === limit
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get merchant profiles by business type
 */
export async function getMerchantProfilesByBusinessType(req, res, next) {
  try {
    const { businessType } = req.params;
    const { limit, offset } = paginationSchema.parse(req.query);

    if (!['retail', 'restaurant', 'service', 'ecommerce', 'other'].includes(businessType)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid business type');
    }

    const profiles = await MerchantProfileModel.getProfilesByBusinessType(businessType, limit, offset);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profiles,
      pagination: {
        limit,
        offset,
        hasMore: profiles.length === limit
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get merchant profile statistics
 */
export async function getMerchantProfileStats(req, res, next) {
  try {
    const stats = await MerchantProfileModel.getProfileStats();

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Search merchant profiles
 */
export async function searchMerchantProfiles(req, res, next) {
  try {
    const { searchTerm } = req.query;
    const { limit, offset } = paginationSchema.parse(req.query);

    if (!searchTerm) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Search term is required');
    }

    const profiles = await MerchantProfileModel.searchProfiles(searchTerm, limit, offset);

    res.status(StatusCodes.OK).json({
      success: true,
      data: profiles,
      pagination: {
        limit,
        offset,
        hasMore: profiles.length === limit
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get merchant profile with activity
 */
export async function getMerchantProfileWithActivity(req, res, next) {
  try {
    const { profileId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const profile = await MerchantProfileModel.getProfileWithActivity(profileId, days);
    
    if (!profile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Merchant profile not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: profile
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update merchant profile status (admin only)
 */
export async function updateMerchantProfileStatus(req, res, next) {
  try {
    const { profileId } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;
    
    if (!adminId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin not authenticated');
    }

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
    }

    const profile = await MerchantProfileModel.getProfileById(profileId);
    
    if (!profile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Merchant profile not found');
    }

    const updatedProfile = await MerchantProfileModel.updateProfileStatus(profileId, status, adminId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedProfile,
      message: `Profile status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
}
