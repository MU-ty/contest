import OpenAI from 'openai';

interface GenerationRequest {
  type: 'text' | 'image' | 'audio' | 'video';
  prompt: string;
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  imageSize?: string;
  imageQuality?: string;
  imageStyle?: string;
  educationLevel?: string;
  subject?: string;
  language?: string;
  tone?: string;
  additionalInstructions?: string;
  parameters?: Record<string, any>;
}

interface GenerationResult {
  id: string;
  content: any;
  provider: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    finishReason: string;
    responseTime: number;
    [key: string]: any;
  };
}

export interface AIProvider {
  generateText(request: GenerationRequest): Promise<GenerationResult>;
  generateImage?(request: GenerationRequest): Promise<GenerationResult>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateText(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(request)
          },
          {
            role: 'user',
            content: request.prompt
          }
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 1,
        frequency_penalty: request.frequencyPenalty || 0,
        presence_penalty: request.presencePenalty || 0,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        id: `openai_${Date.now()}`,
        content,
        provider: 'openai',
        model: request.model || 'gpt-3.5-turbo',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        metadata: {
          finishReason: response.choices[0]?.finish_reason || 'stop',
          responseTime: Date.now()
        }
      };
    } catch (error) {
      console.error('OpenAI生成错误:', error);
      throw new Error('OpenAI内容生成失败');
    }
  }
  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const validSizes = ['256x256', '512x512', '1024x1024', '1536x1024', '1024x1536', '1792x1024', '1024x1792'] as const;
      const size = validSizes.includes(request.imageSize as any) ? request.imageSize as any : '1024x1024';
      
      const response = await this.client.images.generate({
        model: request.model || 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: size,
        quality: (request.imageQuality === 'hd' ? 'hd' : 'standard') as 'standard' | 'hd',
        style: (request.imageStyle === 'natural' ? 'natural' : 'vivid') as 'vivid' | 'natural'
      });      const imageUrl = response.data?.[0]?.url || '';

      return {
        id: `openai_img_${Date.now()}`,
        content: imageUrl,
        provider: 'openai',
        model: request.model || 'dall-e-3',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        metadata: {
          finishReason: 'stop',
          responseTime: Date.now(),
          imageSize: size,
          imageQuality: request.imageQuality,
          imageStyle: request.imageStyle
        }
      };
    } catch (error) {
      console.error('OpenAI图像生成错误:', error);
      throw new Error('OpenAI图像生成失败');
    }
  }

  private buildSystemPrompt(request: GenerationRequest): string {
    let systemPrompt = '你是一个专业的教育内容生成助手，专门帮助教师和学生创建高质量的教学资源。';

    if (request.educationLevel) {
      systemPrompt += `\n目标教育水平：${request.educationLevel}`;
    }

    if (request.subject) {
      systemPrompt += `\n学科领域：${request.subject}`;
    }

    if (request.language) {
      systemPrompt += `\n语言要求：${request.language}`;
    }

    if (request.tone) {
      systemPrompt += `\n内容风格：${request.tone}`;
    }

    if (request.additionalInstructions) {
      systemPrompt += `\n额外要求：${request.additionalInstructions}`;
    }

    systemPrompt += '\n\n请确保生成的内容：\n1. 准确且富有教育价值\n2. 适合目标受众的认知水平\n3. 结构清晰，易于理解\n4. 包含实用的学习要点';

    return systemPrompt;
  }
}

export class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  async generateText(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: request.model || 'claude-3-sonnet-20240229',
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7,
          system: this.buildSystemPrompt(request),
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API错误: ${response.status}`);
      }      const data: any = await response.json();
      const content = data.content?.[0]?.text || '';

      return {
        id: `claude_${Date.now()}`,
        content,
        provider: 'claude',
        model: request.model || 'claude-3-sonnet-20240229',
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        metadata: {
          finishReason: data.stop_reason || 'stop',
          responseTime: Date.now()
        }
      };
    } catch (error) {
      console.error('Claude生成错误:', error);
      throw new Error('Claude内容生成失败');
    }
  }

  private buildSystemPrompt(request: GenerationRequest): string {
    let systemPrompt = '你是一个专业的教育内容生成助手，专门帮助教师和学生创建高质量的教学资源。';

    if (request.educationLevel) {
      systemPrompt += `\n目标教育水平：${request.educationLevel}`;
    }

    if (request.subject) {
      systemPrompt += `\n学科领域：${request.subject}`;
    }

    if (request.language) {
      systemPrompt += `\n语言要求：${request.language}`;
    }

    if (request.tone) {
      systemPrompt += `\n内容风格：${request.tone}`;
    }

    if (request.additionalInstructions) {
      systemPrompt += `\n额外要求：${request.additionalInstructions}`;
    }

    systemPrompt += '\n\n请确保生成的内容：\n1. 准确且富有教育价值\n2. 适合目标受众的认知水平\n3. 结构清晰，易于理解\n4. 包含实用的学习要点';

    return systemPrompt;
  }
}

export class MockProvider implements AIProvider {
  async generateText(request: GenerationRequest): Promise<GenerationResult> {
    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let content = '';
    switch (request.type) {
      case 'text':
        content = `这是一个模拟的AI生成内容，基于您的提示词："${request.prompt}"。

这是为了演示目的而生成的教学资源内容。在实际环境中，这里会是由AI模型生成的高质量教育内容。

内容特点：
- 适合${request.educationLevel || '通用'}教育水平
- 学科：${request.subject || '通用'}
- 语言：${request.language || 'zh-cn'}
- 风格：${request.tone || 'professional'}

请注意：这是模拟内容，实际使用时需要配置真实的AI API密钥。`;
        break;
      default:
        content = `模拟的${request.type}内容生成完成`;
    }

    return {
      id: `mock_${Date.now()}`,
      content,
      provider: 'mock',
      model: 'mock-model',
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: content.length,
        totalTokens: request.prompt.length + content.length
      },
      metadata: {
        finishReason: 'stop',
        responseTime: Date.now(),
        isMock: true
      }
    };
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: `mock_img_${Date.now()}`,
      content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1vY2sgSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==',
      provider: 'mock',
      model: 'mock-image-model',
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 0,
        totalTokens: request.prompt.length
      },
      metadata: {
        finishReason: 'stop',
        responseTime: Date.now(),
        imageSize: request.imageSize || '512x512',
        isMock: true
      }
    };
  }
}

export class AIService {
  private providers: Map<string, AIProvider>;

  constructor() {
    this.providers = new Map();
    
    // 初始化AI提供商
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider());
    }
    
    if (process.env.CLAUDE_API_KEY) {
      this.providers.set('claude', new ClaudeProvider());
    }

    // 添加Mock提供商，支持无API密钥的演示模式
    this.providers.set('mock', new MockProvider());
  }  async generateContent(request: GenerationRequest): Promise<GenerationResult> {
    let providerName = request.provider || 'openai'; // 默认使用openai
    
    // 如果指定的提供商不存在，尝试使用mock
    if (!this.providers.has(providerName)) {
      console.warn(`提供商 ${providerName} 不可用，使用mock提供商`);
      providerName = 'mock';
    }
    
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`不支持的AI提供商: ${providerName}`);
    }

    if (request.type === 'image' && provider.generateImage) {
      return await provider.generateImage(request);
    } else {
      return await provider.generateText(request);
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  isProviderAvailable(provider: string): boolean {
    return this.providers.has(provider);
  }
}

// 导出单例实例
const aiServiceInstance = new AIService();

// 导出便利函数
export const generateContent = (request: GenerationRequest): Promise<GenerationResult> => {
  return aiServiceInstance.generateContent(request);
};

export const getAvailableProviders = (): string[] => {
  return aiServiceInstance.getAvailableProviders();
};

export const isProviderAvailable = (provider: string): boolean => {
  return aiServiceInstance.isProviderAvailable(provider);
};

// 也导出实例，以备需要
export const aiService = aiServiceInstance;
