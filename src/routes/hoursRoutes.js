import express from 'express';
import { body, validationResult } from 'express-validator'; // For validation
import hoursController from '../controllers/hoursController';
import authMiddleware from '../middleware/authMiddleware'; // Assuming authentication middleware

const router = express.Router();

// Validation middleware for hours entries
const validateHoursEntry = [
  body('hours')
    .isArray()
    .withMessage('Hours must be an array of entries.'),
  body('hours.*.dayOfWeek')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week.'),
  body('hours.*.hours')
    .isFloat({ min: 0 }) // Ensure non-negative float
    .withMessage('Hours must be a non-negative number.'),
  body('hours.*.paystubId')
    .isUUID() // Validate UUID format for paystubId
    .withMessage('Invalid paystub ID format.'),
  body('hours.*.date')
    .isISO8601({ strict: true }) // Ensure strict ISO 8601 format (YYYY-MM-DD)
    .toDate() // Converts the string to a Date object (important for DB)
    .withMessage('Date must be a valid ISO 8601 date in YYYY-MM-DD format.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  },
];

// Route to save hours
router.post(
  '/',
  authMiddleware, // Ensure user is authenticated
  validateHoursEntry, // Apply validation middleware
  hoursController.saveHours
);

// Potentially add other routes:
// router.get('/:paystubId', authMiddleware, hoursController.getHoursForPaystub);

export default router;
