import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型创建子目录
    const fileType = getFileTypeForStorage(file.mimetype);
    const typeDir = path.join(uploadDir, fileType);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// 获取文件存储类型（用于文件夹分类）
const getFileTypeForStorage = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || 
      mimetype.includes('msword') || 
      mimetype.includes('wordprocessingml') ||
      mimetype.includes('spreadsheetml') ||
      mimetype.includes('presentationml') ||
      mimetype.includes('rtf') ||
      mimetype.includes('opendocument')) {
    return 'document';
  }
  if (mimetype.startsWith('text/')) {
    return 'text';
  }
  return 'other';
};

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的文件类型
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac'],
    document: [
      // PDF
      'application/pdf',
      // Word文档
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel表格
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint演示文稿
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // 文本文件
      'text/plain',
      'text/markdown',
      'text/csv',
      'text/html',
      'text/xml',
      // 其他文档格式
      'application/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ]
  };

  const allAllowedTypes = [
    ...allowedTypes.image,
    ...allowedTypes.video,
    ...allowedTypes.audio,
    ...allowedTypes.document
  ];

  console.log(`上传文件类型: ${file.mimetype}, 文件名: ${file.originalname}`);

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(`不支持的文件类型: ${file.mimetype}`);
    cb(new Error(`不支持的文件类型: ${file.mimetype}。支持的类型包括: PDF, Word, Excel, PowerPoint, 图片, 音频, 视频等`));
  }
};

// 上传配置
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // 最多10个文件
  }
});

// 单文件上传中间件
export const uploadSingle = upload.single('file');

// 多文件上传中间件
export const uploadMultiple = upload.array('files', 10);

// 处理上传错误的中间件
export const uploadErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制（最大100MB）'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: '文件数量超过限制（最多10个）'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `上传错误: ${error.message}`
        });
    }
  }

  if (error.message.includes('不支持的文件类型')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

// 获取文件类型（用于URL生成和前端显示）
export const getFileType = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || 
      mimetype.includes('msword') || 
      mimetype.includes('wordprocessingml') ||
      mimetype.includes('spreadsheetml') ||
      mimetype.includes('presentationml') ||
      mimetype.includes('rtf') ||
      mimetype.includes('opendocument')) {
    return 'document';
  }
  if (mimetype.startsWith('text/')) {
    return 'text';
  }
  return 'other';
};

// 生成文件URL
export const generateFileUrl = (req: Request, filename: string, type: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${type}/${filename}`;
};
