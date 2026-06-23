import { Router } from 'express';
import {
  getFacultyList,
  getFacultyById,
  addFaculty,
  bulkUploadFaculty,
  updateFacultyDetails,
  deleteFacultyAccount,
  getSemestersList,
  createSemesterName
} from '../controllers/faculty.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply auth to all endpoints
router.use(authenticateToken);

// Faculty lists & semesters - available to both roles
router.get('/', getFacultyList);
router.get('/semesters', getSemestersList);
router.get('/:id', getFacultyById);

// Admin-only endpoints
router.post('/', requireRole('admin'), addFaculty);
router.post('/bulk-upload', requireRole('admin'), bulkUploadFaculty);
router.put('/:id', requireRole('admin'), updateFacultyDetails);
router.delete('/:id', requireRole('admin'), deleteFacultyAccount);
router.post('/semesters', requireRole('admin'), createSemesterName);

export default router;
