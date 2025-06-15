import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  publishResource,
  likeResource
} from '../controllers/resourceController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// 创建资源验证规则
const createResourceValidation = [
  body('title')
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述不能超过1000个字符'),  body('contentType')
    .isIn(['text', 'image', 'audio', 'video', 'presentation', 'interactive'])
    .withMessage('资源类型无效'),
    body('category')
    .isIn(['lesson_plan', 'worksheet', 'presentation', 'quiz', 'assignment', 'reference'])
    .withMessage('资源分类无效'),
    body('content')
    .notEmpty()
    .withMessage('内容不能为空'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      return true;
    }),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('公开设置必须是布尔值'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('难度等级无效')
];

// 更新资源验证规则
const updateResourceValidation = [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('标题不能为空')
    .isLength({ max: 200 })
    .withMessage('标题不能超过200个字符'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('描述不能超过1000个字符'),
  body('contentType')
    .optional()
    .isIn(['text', 'image', 'audio', 'video', 'presentation', 'interactive'])
    .withMessage('资源类型无效'),
  
  body('category')
    .optional()
    .isIn(['lesson_plan', 'worksheet', 'presentation', 'quiz', 'assignment', 'reference'])
    .withMessage('资源分类无效'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('标签数量不能超过10个');
      }
      return true;    }),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('公开设置必须是布尔值'),
  
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('难度等级无效')
];

// 查询参数验证
const getResourcesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
    query('category')
    .optional()
    .isIn(['lesson_plan', 'worksheet', 'presentation', 'quiz', 'assignment', 'reference'])
    .withMessage('资源分类无效'),
    query('contentType')
    .optional()
    .isIn(['text', 'image', 'audio', 'video', 'interactive'])
    .withMessage('资源类型无效'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态无效'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'title', 'views', 'likes'])
    .withMessage('排序字段无效'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序方向无效')
];

// ID参数验证
const idValidation = [
  param('id')
    .custom((value) => {
      // 支持MongoDB ObjectId格式或内存模式下的字符串ID
      const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
      const memoryIdPattern = /^[a-zA-Z0-9_-]+$/;
      
      if (mongoIdPattern.test(value) || memoryIdPattern.test(value)) {
        return true;
      }
      throw new Error('无效的资源ID');
    })
    .withMessage('无效的资源ID')
];

// 路由定义
router.post('/', authMiddleware, createResourceValidation, validate, createResource);
router.get('/', authMiddleware, getResourcesValidation, validate, getResources);
router.get('/:id', authMiddleware, idValidation, validate, getResourceById);
router.put('/:id', authMiddleware, idValidation, updateResourceValidation, validate, updateResource);
router.delete('/:id', authMiddleware, idValidation, validate, deleteResource);
router.post('/:id/publish', authMiddleware, idValidation, validate, publishResource);
router.post('/:id/like', authMiddleware, idValidation, validate, likeResource);

export default router;
