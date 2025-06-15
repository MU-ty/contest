import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/User';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { memoryStore, shouldUseMemoryStore } from '../services/memoryStore';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role = 'student' } = req.body;

    if (shouldUseMemoryStore()) {
      // 使用内存存储
      try {
        const user = await memoryStore.createUser({
          username,
          email,
          password,
          role
        });

        // 生成令牌
        const token = generateToken(user._id);

        res.status(201).json({
          success: true,
          message: '注册成功',
          data: {
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              profile: user.profile,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            },
            token
          }
        });
        return;
      } catch (error) {
        res.status(400).json({
          success: false,
          message: (error as Error).message
        });
        return;
      }
    }

    // 使用MongoDB存储
    // 检查用户是否已存在
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
      return;
    }

    // 创建新用户
    const user = new UserModel({
      username,
      email,
      password,
      role,
      profile: {
        displayName: username,
        bio: '',
        institution: '',
        subjects: [],
        preferences: {
          language: 'zh-CN',
          theme: 'light',
          aiModels: [],
          contentTypes: []
        }
      }
    });

    await user.save();

    // 生成令牌
    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        },
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (shouldUseMemoryStore()) {
      // 使用内存存储
      const user = await memoryStore.findUserByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await memoryStore.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: '邮箱或密码错误'
        });
        return;
      }

      // 更新最后登录时间
      await memoryStore.updateUser(user._id, {
        lastLoginAt: new Date()
      });

      // 生成令牌
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          },
          token
        }
      });
      return;
    }

    // 使用MongoDB存储
    // 查找用户
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
      return;
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken((user._id as any).toString());

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        },
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { displayName, bio, institution, subjects, preferences } = req.body;

    if (shouldUseMemoryStore()) {
      // 使用内存存储
      const updatedUser = await memoryStore.updateUser(userId, {
        profile: {
          displayName: displayName || req.user!.profile.displayName,
          bio: bio || req.user!.profile.bio,
          institution: institution || req.user!.profile.institution,
          subjects: subjects || req.user!.profile.subjects,
          preferences: preferences || req.user!.profile.preferences
        }
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '更新成功',
        data: {
          user: {
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            profile: updatedUser.profile
          }
        }
      });
      return;
    }

    // 使用MongoDB存储
    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'profile.displayName': displayName,
          'profile.bio': bio,
          'profile.institution': institution,
          'profile.subjects': subjects,
          'profile.preferences': preferences
        }
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { currentPassword, newPassword } = req.body;

    if (shouldUseMemoryStore()) {
      // 使用内存存储
      const user = await memoryStore.findUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      // 验证当前密码
      const isCurrentPasswordValid = await memoryStore.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: '当前密码错误'
        });
        return;
      }

      // 更新密码
      const success = await memoryStore.updateUserPassword(userId, newPassword);
      if (!success) {
        res.status(500).json({
          success: false,
          message: '密码修改失败'
        });
        return;
      }

      res.json({
        success: true,
        message: '密码修改成功'
      });
      return;
    }

    // 使用MongoDB存储
    // 获取用户密码
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
      return;
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
};