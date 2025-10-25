import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ApiError } from '../middleware/error.js';
import { MerchantApplicationModel } from '../models/merchant-application.model.js';
import { MerchantProfileModel } from '../models/merchant-profile.model.js';
import { NotificationService } from '../services/notification.service.js';

// Validation schemas
const statusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended']),
  rejectionReason: z.string().optional(),
  adminNotes: z.string().optional(),
  notes: z.string().optional()
});

const paginationSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

/**
 * Get all applications (admin only)
 */
export async function getAllApplications(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const status = req.query.status;

    const applications = await MerchantApplicationModel.getAllApplications(limit, offset, status);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
      pagination: {
        limit,
        offset,
        hasMore: applications.length === limit
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
 * Get pending applications (admin only)
 */
export async function getPendingApplications(req, res, next) {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);

    const applications = await MerchantApplicationModel.getPendingApplications(limit, offset);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get specific application (admin only)
 */
export async function getApplication(req, res, next) {
  try {
    const { applicationId } = req.params;

    const application = await MerchantApplicationModel.getApplicationById(applicationId);

    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
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
 * Update application status (admin only)
 */
export async function updateApplicationStatus(req, res, next) {
  try {
    console.log('🔄 [STATUS UPDATE] Request received');
    console.log('   Application ID:', req.params.applicationId);
    console.log('   Request body:', JSON.stringify(req.body, null, 2));
    console.log('   Admin user:', req.user);

    const { applicationId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      console.log('❌ [STATUS UPDATE] Admin not authenticated');
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin not authenticated');
    }

    console.log('📝 [STATUS UPDATE] Parsing request body with schema');
    let parsedData;
    try {
      parsedData = statusUpdateSchema.parse(req.body);
      console.log('✅ [STATUS UPDATE] Schema validation passed:', parsedData);
    } catch (validationError) {
      console.log('❌ [STATUS UPDATE] Schema validation failed:', validationError);
      throw validationError;
    }

    const { status, rejectionReason, adminNotes } = parsedData;

    console.log(`🔍 [STATUS UPDATE] Fetching application ${applicationId}`);
    const application = await MerchantApplicationModel.getApplicationById(applicationId);

    if (!application) {
      console.log('❌ [STATUS UPDATE] Application not found');
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    console.log('📋 [STATUS UPDATE] Current application status:', application.status);
    console.log('📋 [STATUS UPDATE] Requested new status:', status);

    // Allow status updates based on current status
    if (status === 'suspended') {
      console.log('🚫 [STATUS UPDATE] Processing suspend request');
      // Can only suspend approved merchants
      if (application.status !== 'approved') {
        console.log(`❌ [STATUS UPDATE] Cannot suspend - current status is '${application.status}', must be 'approved'`);
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Can only suspend approved merchants');
      }
      console.log('✅ [STATUS UPDATE] Suspend validation passed');
    } else {
      console.log('📝 [STATUS UPDATE] Processing approve/reject request');
      // Approve/reject only works for pending applications
      if (application.status !== 'pending') {
        console.log(`❌ [STATUS UPDATE] Cannot approve/reject - current status is '${application.status}', must be 'pending'`);
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Application is not pending review');
      }
      console.log('✅ [STATUS UPDATE] Approve/reject validation passed');
    }

    const notes = req.body.notes || adminNotes;
    console.log('💾 [STATUS UPDATE] Updating application status in database');
    console.log('   Status:', status);
    console.log('   Admin ID:', adminId);
    console.log('   Notes:', notes);

    const updatedApplication = await MerchantApplicationModel.updateApplicationStatus(
      applicationId,
      status,
      adminId,
      rejectionReason,
      notes
    );

    console.log('✅ [STATUS UPDATE] Database update successful');
    console.log('   Updated application:', JSON.stringify(updatedApplication, null, 2));

    // Send appropriate notification
    try {
      if (status === 'approved') {
        console.log('📧 [STATUS UPDATE] Sending approval notification');
        await NotificationService.sendApplicationApprovedNotification(updatedApplication);
      } else if (status === 'rejected') {
        console.log('📧 [STATUS UPDATE] Sending rejection notification');
        await NotificationService.sendApplicationRejectedNotification(updatedApplication, rejectionReason);
      } else if (status === 'suspended') {
        console.log(`🚫 [STATUS UPDATE] Merchant ${applicationId} suspended by admin ${adminId}`);
      }
    } catch (notificationError) {
      console.warn('⚠️ [STATUS UPDATE] Failed to send notification:', notificationError.message);
      // Don't fail the status update if notification fails
    }

    console.log('✅ [STATUS UPDATE] Request completed successfully');
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedApplication,
      message: `Application ${status} successfully`
    });
  } catch (err) {
    console.log('❌ [STATUS UPDATE] Error occurred:', err.message);
    console.log('   Error stack:', err.stack);
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status update data', err.flatten()));
    }
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
 * Get merchant profile statistics (admin only)
 */
export async function getMerchantStats(req, res, next) {
  try {
    const [applicationStats, profileStats] = await Promise.all([
      MerchantApplicationModel.getApplicationStats(),
      MerchantProfileModel.getProfileStats()
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        applications: applicationStats,
        profiles: profileStats
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Search merchant profiles (admin only)
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
 * Get applications by status (admin only)
 */
export async function getApplicationsByStatus(req, res, next) {
  try {
    const { status } = req.params;
    const { limit, offset } = paginationSchema.parse(req.query);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid status');
    }

    const applications = await MerchantApplicationModel.getApplicationsByStatus(status, limit, offset);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Invalid pagination parameters', err.flatten()));
    }
    next(err);
  }
}

/**
 * Get SLA violations (admin only)
 */
export async function getSlaViolations(req, res, next) {
  try {
    const slaHours = parseInt(req.query.slaHours) || 48;
    const applications = await MerchantApplicationModel.getApplicationsRequiringReview(slaHours);

    res.status(StatusCodes.OK).json({
      success: true,
      data: applications,
      count: applications.length,
      slaHours
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Send SLA reminder notifications (admin only)
 */
export async function sendSlaReminders(req, res, next) {
  try {
    const slaHours = parseInt(req.query.slaHours) || 48;
    const applications = await MerchantApplicationModel.getApplicationsRequiringReview(slaHours);

    const results = [];
    for (const application of applications) {
      try {
        await NotificationService.sendSlaReminderNotification(application);
        results.push({ applicationId: application.id, status: 'sent' });
      } catch (error) {
        results.push({ applicationId: application.id, status: 'failed', error: error.message });
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: results,
      message: `SLA reminders sent for ${results.length} applications`
    });
  } catch (err) {
    next(err);
  }
}
