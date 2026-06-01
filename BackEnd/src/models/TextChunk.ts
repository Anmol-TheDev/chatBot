import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface ITextChunk extends MongoDocument {
  documentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  wordCount: number;
  metadata: {
    pageNumber?: number;
    startPosition: number;
    endPosition: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const textChunkSchema = new Schema<ITextChunk>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Document ID is required'],
    index: true
  },
  chunkIndex: {
    type: Number,
    required: [true, 'Chunk index is required'],
    min: 0
  },
  content: {
    type: String,
    required: [true, 'Chunk content is required'],
    maxlength: [2000, 'Chunk content cannot exceed 2000 characters']
  },
  wordCount: {
    type: Number,
    required: true,
    min: 0
  },
  metadata: {
    pageNumber: {
      type: Number,
      min: 1
    },
    startPosition: {
      type: Number,
      required: true,
      min: 0
    },
    endPosition: {
      type: Number,
      required: true,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
textChunkSchema.index({ documentId: 1, chunkIndex: 1 });

// Text search index for content
textChunkSchema.index({ content: 'text' });

const TextChunkModel = mongoose.model<ITextChunk>('TextChunk', textChunkSchema);

export default TextChunkModel;