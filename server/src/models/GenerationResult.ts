import mongoose, { Document, Schema } from 'mongoose';

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  INTERACTIVE = 'interactive'
}

export interface GenerationMetadata {
  model: string;
  generatedAt: Date;
  processingTime?: number;
  tokens?: number;
}

export interface GenerationResult {
  id: string;
  content: any;
  contentType: ContentType;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  metadata: GenerationMetadata;
  userId: string;
  prompt: string;
  parameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGenerationResult extends Omit<GenerationResult, 'id'>, Document {}

const generationResultSchema = new Schema<IGenerationResult>({
  content: {
    type: Schema.Types.Mixed,
    required: true
  },  contentType: {
    type: String,
    enum: Object.values(ContentType),
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  error: {
    type: String
  },
  metadata: {
    model: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    processingTime: { type: Number }, // 毫秒
    tokens: { type: Number }
  },  userId: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  parameters: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
generationResultSchema.index({ userId: 1 });
generationResultSchema.index({ status: 1 });
generationResultSchema.index({ contentType: 1 });
generationResultSchema.index({ createdAt: -1 });

export const GenerationResultModel = mongoose.model<IGenerationResult>('GenerationResult', generationResultSchema);
