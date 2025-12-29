import express from 'express';
import { login, logout, getSession } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateLogin } from '../middlewares/validation.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/session', authenticate, getSession);

export default router;
