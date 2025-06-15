import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadSingle, uploadMultiple, uploadErrorHandler, getFileType, generateFileUrl } from '../middleware/upload';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router = express.Router();

// 默认文件上传路由 (用于前端uploadFile调用)
router.post('/', authMiddleware, uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const fileType = getFileType(req.file.mimetype);
    const fileUrl = generateFileUrl(req, req.file.filename, fileType);

    res.json({
      success: true,
      data: {
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filename: req.file.filename,
        originalname: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: '上传失败'
    });
  }
});

// 单文件上�?
router.post('/single', authMiddleware, uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const fileType = getFileType(req.file.mimetype);
    const fileUrl = generateFileUrl(req, req.file.filename, fileType);

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: fileType,
        url: fileUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: '上传失败'
    });
  }
});

// 多文件上�?
router.post('/multiple', authMiddleware, uploadMultiple, (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const files = req.files.map(file => {
      const fileType = getFileType(file.mimetype);
      const fileUrl = generateFileUrl(req, file.filename, fileType);

      return {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type: fileType,
        url: fileUrl,
        path: file.path
      };
    });

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: '上传失败'
    });
  }
});

// 头像上传
router.post('/avatar', authMiddleware, uploadSingle, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传头像文件'
      });
    }    // 检查是否为图片文件
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: '头像必须是图片文件'
      });
    }

    const fileType = 'image';
    const fileUrl = generateFileUrl(req, req.file.filename, fileType);

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: '头像上传失败'
    });
  }
});

// 错误处理中间�?
router.use(uploadErrorHandler);

export default router;
