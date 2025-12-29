import { body, param, query, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Validation rules for login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['STATE_ADMIN', 'DISTRICT_ADMIN', 'BLOCK_ADMIN', 'GP_ADMIN', 'COLLECTION_AGENT'])
    .withMessage('Valid role is required'),
  handleValidationErrors,
];

/**
 * Validation rules for creating a house
 */
export const validateCreateHouse = [
  body('houseNumber')
    .trim()
    .notEmpty()
    .withMessage('House number is required'),
  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('zoneId')
    .isMongoId()
    .withMessage('Valid zone ID is required'),
  body('totalMembers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total members must be at least 1'),
  handleValidationErrors,
];

/**
 * Validation rules for QR scanning
 */
export const validateQRScan = [
  body('qrCode')
    .trim()
    .notEmpty()
    .withMessage('QR code is required'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  handleValidationErrors,
];

/**
 * Validation rules for waste collection
 */
export const validateWasteCollection = [
  body('houseId')
    .isMongoId()
    .withMessage('Valid house ID is required'),
  body('solidWaste')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Solid waste must be non-negative'),
  body('plasticWaste')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Plastic waste must be non-negative'),
  body('organicWaste')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Organic waste must be non-negative'),
  body('totalWaste')
    .isFloat({ min: 0.01 })
    .withMessage('Total waste must be greater than 0'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  handleValidationErrors,
];

/**
 * Validation for MongoDB ObjectId params
 */
export const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors,
];

/**
 * Validation for date range queries
 */
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO 8601 date'),
  handleValidationErrors,
];
