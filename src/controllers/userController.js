import User from '../models/user'; // Assuming Sequelize User model
import s3Service from '../services/s3Service';
import path from 'path'; // For path.extname

const userController = {
  // Existing controller methods...
  // async getUser(req, res) { ... }
  // async updateUser(req, res) { ... }

  async getCurrentUserProfile(req, res) {
    // Assuming authMiddleware attaches user to req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'name', 'email', 'profilePictureUrl'] // Select specific fields
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  },


  async uploadProfilePicture(req, res) {
    const userId = req.params.userId === 'me' ? req.user.id : req.params.userId; // Handle 'me'
    if (!userId || !req.user || req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to upload picture for this user.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const file = req.file; // File is in req.file due to multer memory storage
    const fileExtension = path.extname(file.originalname);
    const s3FileName = `users/${userId}/profile-picture-${Date.now()}${fileExtension}`; // Unique name

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // If user already has a profile picture, delete the old one from S3
      if (user.profilePictureUrl) {
        // Extract the S3 key from the URL. This might require a helper function
        // or storing the S3 key directly in the DB instead of the full URL.
        // For simplicity, assuming a standard S3 URL structure:
        const oldS3KeyMatch = user.profilePictureUrl.match(/amazonaws\.com\/(.*)/);
        if (oldS3KeyMatch && oldS3KeyMatch[1]) {
          await s3Service.deleteFileFromS3(oldS3KeyMatch[1]).catch(deleteError => {
            console.warn('Could not delete old S3 file, might already be gone or path mismatch:', deleteError);
            // Don't block upload if old file deletion fails
          });
        }
      }

      // Upload new file to S3
      const s3Url = await s3Service.uploadFileToS3(file.buffer, s3FileName, file.mimetype);

      // Update user's profilePictureUrl in the database
      user.profilePictureUrl = s3Url;
      await user.save();

      res.status(200).json({ message: 'Profile picture uploaded successfully.', profilePictureUrl: s3Url, data: user });
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      // If S3 upload succeeded but DB update failed, try to delete the S3 object
      if (s3FileName) {
        await s3Service.deleteFileFromS3(s3FileName).catch(deleteError => {
          console.error('Failed to rollback S3 upload after DB error:', deleteError);
        });
      }
      res.status(500).json({ message: error.message || 'Failed to upload profile picture.' });
    }
  },
};

export default userController;
