import { Router } from 'express';
import { register, login, getProfile, updateProfile, getDevelopers } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/developers', authenticate, getDevelopers);

export default router;
