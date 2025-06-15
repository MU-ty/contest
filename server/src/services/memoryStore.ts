import bcrypt from 'bcryptjs';

// 确保字符串处理使用UTF-8编码
process.env.NODE_OPTIONS = '--experimental-vm-modules --max-old-space-size=4096';

export interface MemoryUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  profile: {
    displayName: string;
    bio: string;
    institution: string;
    subjects: string[];
    preferences: {
      language: string;
      theme: string;
      aiModels: string[];
      contentTypes: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface MemoryGenerationResult {
  _id: string;
  userId: string;
  prompt: string;
  contentType: 'text' | 'image' | 'audio' | 'video';
  content: any;
  status: 'pending' | 'completed' | 'failed';
  provider?: string;
  model?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryResource {
  _id: string;
  title: string;
  description: string;
  content: any;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'presentation';
  category: string;
  tags: string[];
  creator: string;
  isPublic: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryStore {
  private users: Map<string, MemoryUser> = new Map();
  private userIdCounter = 1;
  private resourceIdCounter = 1;
  public generationResults: MemoryGenerationResult[] = [];
  public resources: MemoryResource[] = [];

  // 生成用户ID
  private generateUserId(): string {
    return `user_${this.userIdCounter++}`;
  }

  // 生成资源ID
  private generateResourceId(): string {
    return `resource_${this.resourceIdCounter++}`;
  }

  // 创建用户
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<MemoryUser> {
    // 检查用户是否已存在
    const existingUser = Array.from(this.users.values()).find(
      user => user.email === userData.email || user.username === userData.username
    );

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 哈希密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const user: MemoryUser = {
      _id: this.generateUserId(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      profile: {
        displayName: userData.username,
        bio: '',
        institution: '',
        subjects: [],
        preferences: {
          language: 'zh-CN',
          theme: 'light',
          aiModels: [],
          contentTypes: []
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user._id, user);
    return user;
  }

  // 根据邮箱查找用户
  async findUserByEmail(email: string): Promise<MemoryUser | null> {
    const user = Array.from(this.users.values()).find(user => user.email === email);
    return user || null;
  }

  // 根据ID查找用户
  async findUserById(id: string): Promise<MemoryUser | null> {
    return this.users.get(id) || null;
  }

  // 更新用户
  async updateUser(id: string, updateData: Partial<MemoryUser>): Promise<MemoryUser | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // 验证密码
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // 更新用户密码
  async updateUserPassword(id: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }

    // 哈希新密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updatedUser = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return true;
  }

  // 获取所有用户（用于调试）
  getAllUsers(): MemoryUser[] {
    return Array.from(this.users.values());
  }

  // 清空存储
  clear(): void {
    this.users.clear();
    this.userIdCounter = 1;
  }  // 资源管理方法
  createResource(resourceData: Omit<MemoryResource, '_id' | 'createdAt' | 'updatedAt'>): MemoryResource {
    // 深度复制以确保字符串编码正确
    const clonedData = JSON.parse(JSON.stringify(resourceData));
    
    const resource: MemoryResource = {
      _id: this.generateResourceId(),
      ...clonedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.resources.push(resource);
    console.log('📝 创建资源成功:', {
      id: resource._id,
      title: resource.title,
      contentType: resource.contentType
    });
    return resource;
  }

  // 清理损坏的资源数据
  cleanupCorruptedResources(): void {
    const originalLength = this.resources.length;
    this.resources = this.resources.filter(resource => {
      // 检查标题是否包含损坏的字符（问号）
      const hasCorruptedTitle = resource.title.includes('?') && !resource.title.match(/[a-zA-Z0-9\s]/);
      return !hasCorruptedTitle;
    });
    const cleanedCount = originalLength - this.resources.length;
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个损坏的资源`);
    }
  }

  findResources(query: any = {}, options: any = {}): MemoryResource[] {
    let filteredResources = [...this.resources];

    // 应用过滤条件
    if (query.creator) {
      filteredResources = filteredResources.filter(r => r.creator === query.creator);
    }

    if (query.category) {
      filteredResources = filteredResources.filter(r => r.category === query.category);
    }

    if (query.contentType) {
      filteredResources = filteredResources.filter(r => r.contentType === query.contentType);
    }

    if (query.isPublic !== undefined) {
      filteredResources = filteredResources.filter(r => r.isPublic === query.isPublic);
    }

    // 处理 $or 查询（用于权限控制）
    if (query.$or) {
      filteredResources = filteredResources.filter(resource => {
        return query.$or.some((condition: any) => {
          if (condition.creator) {
            return resource.creator === condition.creator;
          }
          if (condition.isPublic !== undefined) {
            return resource.isPublic === condition.isPublic;
          }
          return false;
        });
      });
    }

    // 搜索文本
    if (query.$text && query.$text.$search) {
      const searchTerm = query.$text.$search.toLowerCase();
      filteredResources = filteredResources.filter(r => 
        r.title.toLowerCase().includes(searchTerm) ||
        r.description.toLowerCase().includes(searchTerm) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // 排序
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      filteredResources.sort((a: any, b: any) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (sortOrder === 1) {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // 分页
    if (options.skip || options.limit) {
      const skip = options.skip || 0;
      const limit = options.limit || filteredResources.length;
      filteredResources = filteredResources.slice(skip, skip + limit);
    }

    return filteredResources;
  }

  findResourceById(id: string): MemoryResource | null {
    return this.resources.find(r => r._id === id) || null;
  }

  updateResource(id: string, updateData: Partial<MemoryResource>): MemoryResource | null {
    const index = this.resources.findIndex(r => r._id === id);
    if (index === -1) {
      return null;
    }

    this.resources[index] = {
      ...this.resources[index],
      ...updateData,
      updatedAt: new Date()
    };

    return this.resources[index];
  }

  deleteResource(id: string): boolean {
    const index = this.resources.findIndex(r => r._id === id);
    if (index === -1) {
      return false;
    }

    this.resources.splice(index, 1);
    return true;
  }

  countResources(query: any = {}): number {
    return this.findResources(query).length;
  }
}

// 创建全局实例
export const memoryStore = new MemoryStore();

// 初始化演示用户
const initializeDemoUsers = async () => {
  try {
    console.log('🔧 初始化演示用户...');
    
    // 清理损坏的资源
    memoryStore.cleanupCorruptedResources();
    
    // 创建教师用户
    await memoryStore.createUser({
      username: 'teacher',
      email: 'teacher@example.com',
      password: 'Teacher123',
      role: 'teacher'
    });

    // 创建学生用户
    await memoryStore.createUser({
      username: 'student',
      email: 'student@example.com',
      password: 'Student123',
      role: 'student'
    });

    console.log('✅ 演示用户初始化完成');
    console.log('👨‍🏫 教师账号: teacher@example.com / Teacher123');
    console.log('👨‍🎓 学生账号: student@example.com / Student123');  } catch (error: any) {
    console.log('⚠️ 演示用户初始化失败:', error.message);
  }
};

// 立即初始化演示用户
initializeDemoUsers();

// 检查是否应该使用内存存储
export const shouldUseMemoryStore = (): boolean => {
  // 如果MongoDB连接失败，使用内存存储
  const mongoose = require('mongoose');
  return mongoose.connection.readyState !== 1;
};
