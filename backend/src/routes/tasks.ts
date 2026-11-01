import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  getMyTasks,
  submitProgressUpdate,
  submitTaskReview,
  getGitActivities,
  logGitActivity,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createTask);
router.get('/', authenticate, getTasks);
router.get('/my', authenticate, getMyTasks);
router.get('/git-activity', authenticate, getGitActivities);
router.post('/git-activity', authenticate, logGitActivity);
router.get('/:id', authenticate, getTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);
router.post('/:id/assign', authenticate, assignTask);
router.post('/:id/progress', authenticate, submitProgressUpdate);
router.post('/:id/review', authenticate, submitTaskReview);

export default router;
