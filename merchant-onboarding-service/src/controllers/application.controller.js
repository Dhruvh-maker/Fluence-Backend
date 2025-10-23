import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import { MerchantApplicationModel } from '../models/merchant-application.model.js';
import { NotificationService } from '../services/notification.service.js';

// Validation schemas
const applicationSchema = z.object({
  businessName: z.string().min(1).max(255),
  businessType: z.enum(['retail', 'restaurant', 'service', 'ecommerce', 'other']),
  contactPerson: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().min(1).max(20),
  businessAddress: z.string().min(1),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  bankAccountDetails: z.object({
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    routingNumber: z.string().optional()
  }).optional()
});

const updateApplicationSchema = applicationSchema.partial();

const statusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().optional()
});

/**
 * Submit new merchant application
 */
export async function submitApplication(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    // Check if user already has an application
    const hasExisting = await MerchantApplicationModel.hasExistingApplication(userId);
    if (hasExisting) {
      throw new ApiError(StatusCodes.CONFLICT, 'User already has a pending or approved application');
    }

    // Check application limit
    const appCount = await MerchantApplicationModel.getApplicationCountByUser(userId);
    const maxApplications = parseInt(process.env.MAX_APPLICATIONS_PER_USER || '3');
    if (appCount >= maxApplications) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Maximum ${maxApplications} applications allowed per user`);
    }

    const applicationData = applicationSchema.parse(req.body);
    applicationData.userId = userId;

    const application = await MerchantApplicationModel.createApplication(applicationData);

    // Send notification
    try {
      await NotificationService.sendApplicationSubmittedNotification(application);
    } catch (notificationError) {
      console.warn('Failed to send notification:', notificationError.message);
      // Don't fail the application if notification fails
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application data', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get user's applications
 */
export async function getUserApplications(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const applications = await MerchantApplicationModel.getApplicationByUserId(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get specific application
 */
export async function getApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const application = await MerchantApplicationModel.getApplicationById(applicationId);
    
    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    // Check if user owns this application (unless admin)
    if (application.user_id !== userId && req.user?.role !== 'admin') {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied');
    }

    // Get status history
    const statusHistory = await MerchantApplicationModel.getApplicationStatusHistory(applicationId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...application,
        statusHistory
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update application (only if pending)
 */
export async function updateApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const updateData = updateApplicationSchema.parse(req.body);

    const application = await MerchantApplicationModel.getApplicationById(applicationId);
    
    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    if (application.user_id !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied');
    }

    if (application.status !== 'pending') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot update application that is not pending');
    }

    const updatedApplication = await MerchantApplicationModel.updateApplication(applicationId, updateData);

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedApplication,
      message: 'Application updated successfully'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid update data', err.flatten()));
    }
    next(err);
  }
}

/**
 * Delete application (only if pending)
 */
export async function deleteApplication(req, res, next) {
  try {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const deletedApplication = await MerchantApplicationModel.deleteApplication(applicationId, userId);

    if (!deletedApplication) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found or cannot be deleted');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get application statistics
 */
export async function getApplicationStats(req, res, next) {
  try {
    const stats = await MerchantApplicationModel.getApplicationStats();

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get applications requiring review (SLA check)
 */
export async function getApplicationsRequiringReview(req, res, next) {
  try {
    const slaHours = parseInt(req.query.slaHours) || 48;
    const applications = await MerchantApplicationModel.getApplicationsRequiringReview(slaHours);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (err) {
    next(err);
  }
}
