import { Request, Response } from 'express';
import { ResourceModel, IResource } from '../models/Resource';
import { AuthenticatedRequest } from '../middleware/auth';
import { memoryStore } from '../services/memoryStore';

export const createResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const resourceData = {
      ...req.body,
      creator: userId
    };

    let resource: any;

    try {
      // 尝试使用MongoDB
      const mongoResource = new ResourceModel(resourceData);
      await mongoResource.save();
      resource = mongoResource;
    } catch (mongoError) {
      console.warn('MongoDB保存失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      resource = memoryStore.createResource(resourceData);
    }

    res.status(201).json({
      success: true,
      message: '资源创建成功',
      data: { resource }
    });
  } catch (error) {
    console.error('创建资源错误:', error);
    res.status(500).json({
      success: false,
      message: '创建资源失败'
    });
  }
};

export const getResources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      contentType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user!._id.toString();
    const userRole = req.user!.role;

    // 构建查询条件
    const query: any = {};

    // 非管理员只能看到自己的资源和公开的资源
    if (userRole !== 'admin') {
      query.$or = [
        { creator: userId },
        { isPublic: true }
      ];
    }

    if (category) query.category = category;
    if (contentType) query.contentType = contentType;
    if (search) {
      query.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    let resources: any[] = [];
    let total = 0;

    try {
      // 尝试使用MongoDB
      const [mongoResources, mongoTotal] = await Promise.all([
        ResourceModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(Number(limit)),
        ResourceModel.countDocuments(query)
      ]);
      resources = mongoResources;
      total = mongoTotal;
    } catch (mongoError) {
      console.warn('MongoDB查询失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      const memoryOptions = {
        sort,
        skip,
        limit: Number(limit)
      };
      resources = memoryStore.findResources(query, memoryOptions);
      total = memoryStore.countResources(query);
    }

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('获取资源列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取资源列表失败'
    });
  }
};

export const getResourceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;

    let resource: any = null;

    try {
      // 尝试使用MongoDB
      resource = await ResourceModel.findById(id);
    } catch (mongoError) {
      console.warn('MongoDB查询失败，使用内存存储:', mongoError);
      // 使用内存存储作为后备
      resource = memoryStore.findResourceById(id);
    }

    if (!resource) {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
      return;
    }

    // 权限检查
    const isOwner = resource.creator === userId;
    const isPublic = resource.isPublic;
    
    if (!isOwner && !isPublic && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: '没有权限访问此资源'
      });
      return;
    }

    // 增加浏览次数
    if (!isOwner) {
      resource.views += 1;
      await resource.save();
    }

    res.json({
      success: true,
      data: { resource }
    });
  } catch (error) {
    console.error('获取资源详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取资源详情失败'
    });
  }
};

export const updateResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;

    const resource = await ResourceModel.findById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
      return;
    }

    // 权限检查
    const isOwner = resource.creator === userId;
    if (!isOwner && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: '没有权限修改此资源'
      });
      return;
    }

    // 更新资源
    const updatedResource = await ResourceModel.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: '资源更新成功',
      data: { resource: updatedResource }
    });
  } catch (error) {
    console.error('更新资源错误:', error);
    res.status(500).json({
      success: false,
      message: '更新资源失败'
    });
  }
};

export const deleteResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();
    const userRole = req.user!.role;

    let resource: any = null;
    let isMongoDb = false;

    // 尝试从MongoDB获取资源
    try {
      resource = await ResourceModel.findById(id);
      isMongoDb = true;
    } catch (mongoError) {
      console.warn('MongoDB查询失败，尝试内存存储:', mongoError);
      // 尝试从内存存储获取资源
      resource = memoryStore.findResourceById(id);
    }

    if (!resource) {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
      return;
    }

    // 权限检查
    const isOwner = resource.creator === userId;
    if (!isOwner && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: '没有权限删除此资源'
      });
      return;
    }

    // 删除资源
    if (isMongoDb) {
      await ResourceModel.findByIdAndDelete(id);
    } else {
      const deleted = memoryStore.deleteResource(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: '删除失败，资源可能已不存在'
        });
        return;
      }
    }

    res.json({
      success: true,
      message: '资源删除成功'
    });
  } catch (error) {
    console.error('删除资源错误:', error);
    res.status(500).json({
      success: false,
      message: '删除资源失败'
    });
  }
};

export const likeResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const resource = await ResourceModel.findById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
      return;
    }

    const hasLiked = resource.likes.includes(userId);

    if (hasLiked) {
      // 取消点赞
      resource.likes = resource.likes.filter(
        (like) => like !== userId
      );
    } else {
      // 添加点赞
      resource.likes.push(userId);
    }

    await resource.save();

    res.json({
      success: true,
      message: hasLiked ? '取消点赞成功' : '点赞成功',
      data: {
        liked: !hasLiked,
        likesCount: resource.likes.length
      }
    });
  } catch (error) {
    console.error('点赞资源错误:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
};

export const publishResource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id.toString();

    const resource = await ResourceModel.findById(id);

    if (!resource) {
      res.status(404).json({
        success: false,
        message: '资源不存在'
      });
      return;
    }

    // 权限检查
    if (resource.creator !== userId) {
      res.status(403).json({
        success: false,
        message: '只能发布自己的资源'
      });
      return;
    }

    resource.isPublic = true;
    await resource.save();

    res.json({
      success: true,
      message: '资源发布成功',
      data: { resource }
    });
  } catch (error) {
    console.error('发布资源错误:', error);
    res.status(500).json({
      success: false,
      message: '发布资源失败'
    });
  }
};