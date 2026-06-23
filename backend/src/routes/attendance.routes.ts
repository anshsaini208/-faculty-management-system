import { Router } from 'express';
import { getTodaySchedule, submitTodaySchedule, getRealTimeAvailability } from '../controllers/attendance.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/today-schedule', getTodaySchedule);
router.post('/submit-schedule', submitTodaySchedule);
router.get('/availability', getRealTimeAvailability);

export default router;
