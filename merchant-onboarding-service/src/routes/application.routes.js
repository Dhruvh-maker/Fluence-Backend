import { Router } from 'express';
import { verifyAuthToken } from '../middleware/auth.js';
import {
  submitApplication,
  getUserApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
  getApplicationsRequiringReview
} from '../controllers/application.controller.js';

const router = Router();

// All routes require authentication
router.use(verifyAuthToken());

// Application routes
router.post('/', submitApplication);
router.get('/', getUserApplications);
router.get('/stats', getApplicationStats);
router.get('/sla-check', getApplicationsRequiringReview);
router.get('/:applicationId', getApplication);
router.put('/:applicationId', updateApplication);
router.delete('/:applicationId', deleteApplication);

export default router;
