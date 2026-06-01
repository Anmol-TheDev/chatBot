import cloudinary from '../config/cloudinary.js';
import AppError from '../utils/AppError.js';

export class CloudinaryService {
  /**
   * Delete a file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'raw'
      });
      
      if (result.result !== 'ok') {
        console.error('Failed to delete file from Cloudinary:', result);
        throw new Error('Failed to delete file from Cloudinary');
      }
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw new AppError('Failed to delete file from cloud storage', 500);
    }
  }

  /**
   * Get file info from Cloudinary
   */
  static async getFileInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'raw'
      });
      return result;
    } catch (error) {
      console.error('Cloudinary get file info error:', error);
      throw new AppError('Failed to get file information', 500);
    }
  }

  /**
   * Download file content from Cloudinary URL
   */
  static async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('File download error:', error);
      throw new AppError('Failed to download file from cloud storage', 500);
    }
  }
}