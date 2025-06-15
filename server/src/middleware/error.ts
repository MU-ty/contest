import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('错误详情:', error);

  let statusCode = error.statusCode || 500;
  let message = error.message || '服务器内部错误';

  // MongoDB错误处理
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = '无效的数据格式';
  }

  // 重复键错误
  if (error.message.includes('duplicate key')) {
    statusCode = 400;
    message = '数据已存在';
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '无效的访问令牌';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '访问令牌已过期';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.originalUrl} 不存在`
  });
};
