// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  institution?: string;
  subjects?: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  aiModels: string[];
  contentTypes: ContentType[];
}

// 教学资源相关类型
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  category: ResourceCategory;
  tags: string[];
  content: ResourceContent;
  metadata: ResourceMetadata;
  author: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  INTERACTIVE = 'interactive'
}

export enum ResourceCategory {
  LESSON_PLAN = 'lesson_plan',
  EXERCISE = 'exercise',
  QUIZ = 'quiz',
  MATERIAL = 'material',
  REFERENCE = 'reference',
  MULTIMEDIA = 'multimedia'
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

// AI生成相关类型
export interface GenerationRequest {
  type: ContentType;
  prompt: string;
  parameters: GenerationParameters;
  context?: GenerationContext;
}

export interface GenerationParameters {
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  style?: string;
  format?: string;
  quality?: 'draft' | 'standard' | 'high';
}

export interface GenerationContext {
  subject: string;
  gradeLevel: string;
  learningObjectives: string[];
  existingResources?: string[];
  targetAudience: string;
}

export interface GenerationResult {
  id: string;
  content: any;
  type: ContentType;
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  metadata: {
    model: string;
    generatedAt: Date;
    processingTime: number;
    tokens?: number;
  };
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 搜索和过滤类型
export interface SearchFilters {
  query?: string;
  type?: ContentType[];
  category?: ResourceCategory[];
  subject?: string[];
  gradeLevel?: string[];
  tags?: string[];
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'popularity';
  order: 'asc' | 'desc';
}

// 协作相关类型
export interface Collaboration {
  resourceId: string;
  participants: CollaborationParticipant[];
  permissions: CollaborationPermissions;
  history: CollaborationHistory[];
  isActive: boolean;
}

export interface CollaborationParticipant {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
}

export interface CollaborationPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
}

export interface CollaborationHistory {
  id: string;
  userId: string;
  action: 'create' | 'edit' | 'delete' | 'comment' | 'share';
  description: string;
  timestamp: Date;
  changes?: any;
}
