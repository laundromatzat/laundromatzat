import express from 'express';
import userController from '../controllers/userController';
import authMiddleware from '../middleware/authMiddleware'; // Assuming authentication middleware exists
import upload from '../middleware/multerConfig'; // Import multer config

const router = express.Router();

// Existing user routes...
// router.get('/:id', authMiddleware, userController.getUser);
// router.put('/:id', authMiddleware, userController.updateUser);

// New or modified route for profile picture upload
// Assuming userId comes from authenticated user or is passed in path.
// For 'me' scenario, authMiddleware would attach user info to req.user
router.post(
  '/:userId/profile-picture',
  authMiddleware, // Ensure user is authenticated
  upload.single('profilePicture'), // 'profilePicture' is the field name from the frontend FormData
  userController.uploadProfilePicture
);

// New route to get current user profile (if 'me' is not handled in existing routes)
router.get('/me', authMiddleware, userController.getCurrentUserProfile);


export default router;
