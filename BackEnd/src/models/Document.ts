import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface IDocument extends MongoDocument {
  fileName: string;
  fileType: string;
  filePath: string;        // Cloudinary URL
  cloudinaryId: string;    // Cloudinary public_id for deletion
  extractedText: string;
  uploadedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot be more than 255 characters']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    enum: {
      values: ['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx'],
      message: 'File type must be one of: pdf, doc, docx, txt, md, xls, xlsx'
    }
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required'],
    trim: true
  },
  extractedText: {
    type: String,
    default: '',
    maxlength: [50000, 'Extracted text cannot be more than 50000 characters']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
documentSchema.index({ fileName: 1 });
documentSchema.index({ fileType: 1 });
documentSchema.index({ uploadedAt: -1 });
documentSchema.index({ cloudinaryId: 1 });

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;