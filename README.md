# 数字化教学资源生成系统

基于多模态大模型技术的智能教学资源生成平台，能够自动创建和管理多种形式的教学内容。

## 项目特性

### 🎯 核心功能
- **多模态内容生成**：支持文本、图像、音频、视频等多种教学资源的AI生成
- **智能内容优化**：基于教学场景自动优化内容质量和适用性
- **个性化定制**：根据不同学习者特征生成个性化教学材料
- **资源管理系统**：完整的教学资源存储、分类、检索和分享功能

### 🛠 技术栈
- **前端**：React 18 + TypeScript + Ant Design
- **后端**：Node.js + Express + TypeScript
- **数据库**：MongoDB
- **AI集成**：支持OpenAI GPT、Claude、文心一言等多种大模型
- **文件处理**：支持PDF、Word、PPT、图片、音频、视频等格式

### 📋 系统架构
```
educational-resource-generator/
├── client/                 # React前端应用
├── server/                 # Node.js后端服务
├── shared/                 # 共享类型和工具
├── docs/                   # 项目文档
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm 或 yarn

### 安装依赖
```bash
# 安装所有依赖
npm run install:all
```

### 启动开发服务器
```bash
# 同时启动前端和后端开发服务器
npm run dev
```

### 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000

## 功能模块

### 1. 用户认证与权限管理
- 用户注册、登录、角色管理
- 教师、学生、管理员权限控制

### 2. 内容生成模块
- **文档生成**：自动生成教案、课件、习题等
- **图像生成**：创建教学插图、图表、示意图
- **音频生成**：生成语音讲解、音频课程
- **视频生成**：制作教学视频、动画演示

### 3. 资源管理模块
- 文件上传、存储、版本控制
- 分类标签、搜索过滤
- 批量操作、导入导出

### 4. 智能推荐系统
- 基于用户行为的内容推荐
- 学习路径规划
- 个性化资源匹配

### 5. 协作与分享
- 团队协作编辑
- 资源分享、评论
- 社区交流平台

## 开发指南

### 前端开发
```bash
cd client
npm start
```

### 后端开发
```bash
cd server
npm run dev
```

### 构建部署
```bash
npm run build
npm start
```

## API文档

详细的API文档请参考：[API Documentation](docs/api.md)

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
