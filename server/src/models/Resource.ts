import mongoose, { Document, Schema } from 'mongoose';

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  PRESENTATION = 'presentation',
  INTERACTIVE = 'interactive'
}

export enum ResourceCategory {
  LESSON_PLAN = 'lesson_plan',
  WORKSHEET = 'worksheet',
  PRESENTATION = 'presentation',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  REFERENCE = 'reference'
}

export interface ResourceContent {
  data: any;
  format: string;
  size?: number;
  duration?: number;
  url?: string;
}

export interface ResourceMetadata {
  subject: string;
  gradeLevel: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  learningObjectives: string[];
  prerequisites: string[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  category: ResourceCategory;
  content: ResourceContent;
  metadata: ResourceMetadata;
  tags: string[];
  isPublic: boolean;
  creator: string;
  collaborators: string[];
  likes: string[];
  views: number;
  generationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResource extends Omit<Resource, 'id'>, Document {}

const resourceContentSchema = new Schema({
  data: { type: Schema.Types.Mixed, required: true },
  format: { type: String, required: true },
  size: { type: Number },
  duration: { type: Number },
  url: { type: String }
});

const resourceMetadataSchema = new Schema({
  subject: { type: String, required: true },
  gradeLevel: [{ type: String, required: true }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  estimatedTime: { type: Number, required: true }, // 分钟
  learningObjectives: [{ type: String }],
  prerequisites: [{ type: String }]
});

const resourceSchema = new Schema<IResource>({
  title: {
    type: String,
    required: [true, '标题是必需的'],
    trim: true,
    maxlength: [200, '标题最多200个字符']
  },
  description: {
    type: String,
    required: [true, '描述是必需的'],
    maxlength: [1000, '描述最多1000个字符']
  },  contentType: {
    type: String,
    enum: Object.values(ContentType),
    required: [true, '内容类型是必需的']
  },
  category: {
    type: String,
    enum: Object.values(ResourceCategory),
    required: [true, '资源分类是必需的']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '标签最多50个字符']
  }],
  content: {
    type: resourceContentSchema,
    required: true
  },
  metadata: {
    type: resourceMetadataSchema,
    required: true
  },  creator: {
    type: String,
    required: true
  },  collaborators: [{
    type: String
  }],
  likes: [{
    type: String
  }],
  views: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  generationId: {
    type: String
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
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ contentType: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ creator: 1 });
resourceSchema.index({ isPublic: 1 });
resourceSchema.index({ 'metadata.subject': 1 });
resourceSchema.index({ 'metadata.gradeLevel': 1 });
resourceSchema.index({ createdAt: -1 });

export const ResourceModel = mongoose.model<IResource>('Resource', resourceSchema);
