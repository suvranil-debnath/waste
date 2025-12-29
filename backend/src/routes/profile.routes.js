import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authenticate } from '../middlewares/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middlewares/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation for profile update
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .optional()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors,
];

// Profile routes
router.get('/', getProfile);
router.put('/', validateProfileUpdate, updateProfile);

export default router;
