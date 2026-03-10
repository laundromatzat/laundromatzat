import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const s3Service = {
  /**
   * Uploads a file buffer to AWS S3.
   * @param {Buffer} fileBuffer - The file content as a Buffer.
   * @param {string} fileName - The desired name of the file in S3 (e.g., userId/profile.jpg).
   * @param {string} contentType - The MIME type of the file (e.g., 'image/jpeg').
   * @returns {Promise<string>} The S3 URL of the uploaded file.
   */
  async uploadFileToS3(fileBuffer, fileName, contentType) {
    if (!S3_BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables.');
    }

    const uploadParams = {
      Bucket: S3_BUCKET_NAME,
      Key: fileName, // e.g., 'users/userId/profile-picture.jpg'
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make the object publicly accessible
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
      const s3Url = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      console.log(`File uploaded to S3: ${s3Url}`);
      return s3Url;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  },

  /**
   * Deletes a file from AWS S3.
   * @param {string} fileName - The key of the file to delete (e.g., 'users/userId/profile.jpg').
   */
  async deleteFileFromS3(fileName) {
    if (!S3_BUCKET_NAME) {
      console.warn('AWS_S3_BUCKET_NAME is not defined. Skipping S3 delete operation.');
      return;
    }

    const deleteParams = {
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      console.log(`File deleted from S3: ${fileName}`);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }
};

export default s3Service;
