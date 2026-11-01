import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
  checkProjectDeadlines,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createProject);
router.get('/', authenticate, getProjects);
router.post('/check-deadlines', authenticate, checkProjectDeadlines);
router.get('/:id', authenticate, getProject);
router.post('/:id/check-deadlines', authenticate, checkProjectDeadlines);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);
router.get('/:id/stats', authenticate, getProjectStats);

export default router;
