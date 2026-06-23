import { Router } from 'express';
import {
  getDeanDashboardStats,
  getFacultyWorkloadAnalytics,
  getFacultyPersonalAnalytics,
  getAdvancedAnalytics
} from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/dean-dashboard', getDeanDashboardStats);
router.get('/workload', getFacultyWorkloadAnalytics);
router.get('/advanced', getAdvancedAnalytics);
router.get('/faculty/:facultyId?', getFacultyPersonalAnalytics);

export default router;
