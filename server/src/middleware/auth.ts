import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User';
import { memoryStore, shouldUseMemoryStore, MemoryUser } from '../services/memoryStore';

export interface AuthenticatedRequest extends Request {
  user?: (IUser & { _id: any }) | MemoryUser;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ message: '访问令牌未提供', success: false });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    let user;
    if (shouldUseMemoryStore()) {
      // 使用内存存储
      user = await memoryStore.findUserById(decoded.userId);
    } else {
      // 使用MongoDB存储
      user = await UserModel.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      res.status(401).json({ message: '用户不存在', success: false });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(401).json({ message: '无效的访问令牌', success: false });
  }
};

export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: '需要管理员权限', success: false });
    return;
  }
  next();
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};
