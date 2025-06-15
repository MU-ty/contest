import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware/error';
import authRoutes from './routes/auth';
import resourceRoutes from './routes/resources';
import aiRoutes from './routes/ai';
import uploadRoutes from './routes/upload';

// 加载环境变量
dotenv.config();

// 设置默认编码为UTF-8
process.env.LANG = 'zh_CN.UTF-8';
process.env.LC_ALL = 'zh_CN.UTF-8';

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中间件
app.use(helmet());
app.use(compression());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// CORS配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// 请求解析中间件
app.use(express.json({ 
  limit: '50mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 1000,
  type: 'application/x-www-form-urlencoded'
}));

// 设置响应编码中间件
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// 日志中间件
app.use(morgan('combined'));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// 404处理
app.use(notFound);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 尝试连接数据库
    await connectDB();
    console.log('✅ 使用MongoDB数据库');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    console.log('🔄 切换到内存模式运行...');
    // 继续运行但使用内存存储
  }
  
  // 无论数据库连接成功与否都启动服务器
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
    console.log(`📱 API文档: http://localhost:${PORT}/api/docs`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
    console.log('📊 运行模式: 内存存储');
  });
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 收到SIGTERM信号，正在优雅关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 收到SIGINT信号，正在优雅关闭服务器...');
  process.exit(0);
});

startServer();