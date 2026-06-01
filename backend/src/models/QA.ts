import mongoose, { Document as MongoDocument, Schema } from 'mongoose';

export interface IQA extends MongoDocument {
  question: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
}

const qaSchema = new Schema<IQA>({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    minlength: [5, 'Question must be at least 5 characters long'],
    maxlength: [500, 'Question cannot be more than 500 characters']
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true,
    minlength: [5, 'Answer must be at least 5 characters long'],
    maxlength: [2000, 'Answer cannot be more than 2000 characters']
  }
}, {
  timestamps: true
});

// Index for better search performance
qaSchema.index({ question: 'text', answer: 'text' });
qaSchema.index({ createdAt: -1 });

const QAModel = mongoose.model<IQA>('QA', qaSchema);

export default QAModel;