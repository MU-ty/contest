import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  aiModels: string[];
  contentTypes: string[];
}

export interface UserProfile {
  displayName: string;
  bio?: string;
  institution?: string;
  subjects: string[];
  preferences: UserPreferences;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface IUser extends Omit<User, 'id'>, Document {
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userPreferencesSchema = new Schema<UserPreferences>({
  language: { type: String, default: 'zh-CN' },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  aiModels: [{ type: String }],
  contentTypes: [{ type: String }]
});

const userProfileSchema = new Schema({
  displayName: { type: String, required: true },
  bio: { type: String },
  institution: { type: String },
  subjects: [{ type: String }],
  preferences: { type: userPreferencesSchema, default: {} }
});

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [30, '用户名最多30个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT
  },
  avatar: {
    type: String,
    default: ''
  },  profile: {
    type: userProfileSchema,
    required: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 索引
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

export const UserModel = mongoose.model<IUser>('User', userSchema);
