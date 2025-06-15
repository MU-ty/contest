import { Response } from 'express';
import * as aiService from '../services/aiService';
import { GenerationResultModel, IGenerationResult } from '../models/GenerationResult';
import { AuthenticatedRequest } from '../middleware/auth';
import { memoryStore, MemoryGenerationResult } from '../services/memoryStore';

interface GenerationRequest {
  type: 'text' | 'image' | 'audio' | 'video';
  prompt: string;
  model?: string;
  provider?: string;
  parameters?: Record<string, any>;
}

export const generateContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const generationRequest: GenerationRequest = {
      ...req.body,
      userId: userId
    };

    // 检查AI提供商是否可用
    if (generationRequest.provider && !aiService.isProviderAvailable(generationRequest.provider)) {
      res.status(400).json({
        success: false,
        message: `AI提供商 ${generationRequest.provider} 不可用`
      });
      return;
    }    // 调用AI服务生成内容
    const result = await aiService.generateContent(generationRequest);    // 保存生成结果到数据库或内存存储
    const generationResult: any = {
      _id: new Date().getTime().toString(),
      userId: userId,
      prompt: generationRequest.prompt,
      contentType: generationRequest.type,
      content: result.content,
      status: 'completed' as const,
      metadata: result.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // 尝试保存到MongoDB
      const mongoResult = new GenerationResultModel(generationResult);
      await mongoResult.save();
      generationResult._id = String(mongoResult._id);
    } catch (mongoError) {
      console.warn('MongoDB保存失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      if (!memoryStore.generationResults) {
        memoryStore.generationResults = [];
      }
      memoryStore.generationResults.push(generationResult);
    }res.json({
      success: true,
      message: '内容生成成功',
      data: {
        id: generationResult._id,
        result
      }
    });
  } catch (error) {
    console.error('内容生成错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '内容生成失败'
    });
  }
};

export const getGenerationHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const {
      page = 1,
      limit = 20,
      provider,
      type,
      status
    } = req.query;

    const query: any = { userId: userId };
    
    if (provider) query['provider'] = provider;
    if (type) query['contentType'] = type;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    let results: any[] = [];
    let total = 0;

    try {
      // 尝试从MongoDB获取
      const [mongoResults, mongoTotal] = await Promise.all([
        GenerationResultModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        GenerationResultModel.countDocuments(query)
      ]);
      results = mongoResults;
      total = mongoTotal;
    } catch (mongoError) {
      console.warn('MongoDB查询失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      const memoryResults = memoryStore.generationResults || [];
      const filteredResults = memoryResults.filter((result: any) => {
        if (result.userId !== userId) return false;
        if (provider && result.provider !== provider) return false;
        if (type && result.contentType !== type) return false;
        if (status && result.status !== status) return false;
        return true;
      });
      
      total = filteredResults.length;
      results = filteredResults
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + Number(limit));
    }

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取生成历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取生成历史失败'
    });
  }
};

export const getGenerationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    let result: any = null;

    try {
      // 尝试从MongoDB获取
      result = await GenerationResultModel.findOne({
        _id: id,
        userId: userId
      });
    } catch (mongoError) {
      console.warn('MongoDB查询失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      const memoryResults = memoryStore.generationResults || [];
      result = memoryResults.find((r: any) => r._id === id && r.userId === userId);
    }

    if (!result) {
      res.status(404).json({
        success: false,
        message: '生成记录不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error('获取生成记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取生成记录失败'
    });
  }
};

export const deleteGenerationResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    let result: any = null;

    try {
      // 尝试从MongoDB删除
      result = await GenerationResultModel.findOneAndDelete({
        _id: id,
        userId: userId
      });
    } catch (mongoError) {
      console.warn('MongoDB删除失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      const memoryResults = memoryStore.generationResults || [];
      const index = memoryResults.findIndex((r: any) => r._id === id && r.userId === userId);
      if (index !== -1) {
        result = memoryResults[index];
        memoryResults.splice(index, 1);
      }
    }

    if (!result) {
      res.status(404).json({
        success: false,
        message: '生成记录不存在'
      });
      return;
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除生成记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除生成记录失败'
    });
  }
};

export const getAvailableProviders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const providers = aiService.getAvailableProviders();
    
    res.json({
      success: true,
      data: { providers }
    });  } catch (error) {
    console.error('获取AI提供商错误:', error);
    res.status(500).json({
      success: false,
      message: '获取AI提供商失败'
    });
  }
};
