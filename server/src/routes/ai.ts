import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  generateContent,
  getGenerationHistory,
  getGenerationById,
  deleteGenerationResult,
  getAvailableProviders
} from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// 内容生成验证规则
const generateContentValidation = [
  body('prompt')
    .notEmpty()
    .withMessage('提示词不能为空')
    .isLength({ max: 4000 })
    .withMessage('提示词不能超过4000个字符'),
    body('provider')
    .isIn(['openai', 'claude', 'baidu', 'mock'])
    .withMessage('AI提供商无效'),
    body('type')
    .isIn(['text', 'image', 'audio', 'video'])
    .withMessage('生成类型无效'),
  
  body('model')
    .optional()
    .isString()
    .withMessage('模型名称必须是字符串'),
  
  body('maxTokens')
    .optional()
    .isInt({ min: 1, max: 4000 })
    .withMessage('最大Token数必须在1-4000之间'),
  
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('温度参数必须在0-2之间'),
  
  body('topP')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('TopP参数必须在0-1之间'),
  
  body('educationLevel')
    .optional()
    .isIn(['elementary', 'middle', 'high', 'university', 'adult'])
    .withMessage('教育水平无效'),
  
  body('subject')
    .optional()
    .isString()
    .withMessage('学科必须是字符串'),
  
  body('language')
    .optional()
    .isIn(['zh-cn', 'en-us'])
    .withMessage('语言设置无效'),
  
  body('tone')
    .optional()
    .isIn(['formal', 'casual', 'friendly', 'professional'])
    .withMessage('语调设置无效'),
  
  body('imageSize')
    .optional()
    .isIn(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
    .withMessage('图像尺寸无效'),
  
  body('imageQuality')
    .optional()
    .isIn(['standard', 'hd'])
    .withMessage('图像质量设置无效'),
  
  body('imageStyle')
    .optional()
    .isIn(['natural', 'vivid'])
    .withMessage('图像风格设置无效')
];

// 查询历史记录验证规则
const getHistoryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('provider')
    .optional()
    .isIn(['openai', 'claude', 'baidu'])
    .withMessage('AI提供商无效'),
  
  query('type')
    .optional()
    .isIn(['text', 'image'])
    .withMessage('生成类型无效'),
  
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed'])
    .withMessage('状态无效')
];

// ID参数验证
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('无效的记录ID')
];

// 路由定义
router.post('/generate', authMiddleware, generateContentValidation, validate, generateContent);
router.get('/history', authMiddleware, getHistoryValidation, validate, getGenerationHistory);
router.get('/providers', authMiddleware, getAvailableProviders);
router.get('/:id', authMiddleware, idValidation, validate, getGenerationById);
router.delete('/:id', authMiddleware, idValidation, validate, deleteGenerationResult);

export default router;
