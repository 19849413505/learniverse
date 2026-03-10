import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { ChatAgent } from './agents/chat.agent';
import { LocateAgent } from './agents/locate.agent';
import { QuestionAgent } from './agents/question.agent';
import { CourseBuilderAgent, CourseGraphOutput } from './agents/course-builder.agent';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private readonly useMock: boolean;

  private apiKey?: string;
  private baseURL?: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    this.useMock = !this.apiKey;

    if (!this.useMock) {
      this.baseURL = 'https://api.deepseek.com/v1';
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
      this.logger.log('DeepSeek AI initialized successfully.');
    } else {
      this.logger.warn('DEEPSEEK_API_KEY not found. Using Mock AI Service.');
    }
  }

  private validateBaseUrl(url?: string): string {
    const defaultUrl = 'https://api.deepseek.com/v1';
    if (!url) return defaultUrl;

    // Handle common missing /v1 path for DeepSeek
    if (url === 'https://api.deepseek.com' || url === 'https://api.deepseek.com/') {
       return defaultUrl;
    }

    try {
      const parsedUrl = new URL(url);

      // Explicitly allow http and https
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
         this.logger.warn(`Invalid protocol ${parsedUrl.protocol} in baseURL, falling back to default.`);
         return defaultUrl;
      }

      // In a local/desktop environment (like Electron or local dev), we WANT to allow
      // localhost and private IPs so users can use local models like Ollama or LM Studio.
      return url;
    } catch (e) {
      this.logger.warn(`Failed to parse baseURL ${url}, falling back to default.`);
      return defaultUrl;
    }
  }

  private getClient(customConfig?: { apiKey?: string; baseURL?: string }): OpenAI | null {
    const creds = this.resolveCredentials(customConfig);
    if (creds && creds.apiKey) {
      return new OpenAI({
        apiKey: creds.apiKey,
        baseURL: creds.baseURL,
      });
    }
    return this.openai;
  }

  // Factory Methods for specific DeepTutor Agents

  private resolveCredentials(customConfig?: { apiKey?: string; baseURL?: string }) {
    const defaultUrl = 'https://api.deepseek.com/v1';

    // Let's be lenient: if the user typed https://api.deepseek.com, we treat it as default too,
    // or at least let the validateBaseUrl add the /v1 if missing.
    let resolvedUrl = customConfig?.baseURL ? this.validateBaseUrl(customConfig.baseURL) : defaultUrl;

    // If the user provided a custom URL, DO NOT send our private API key to it.
    // The user MUST provide their own API key for their custom URL.
    if (resolvedUrl && resolvedUrl !== defaultUrl) {
      return {
        apiKey: customConfig?.apiKey || 'mock-key', // Local models like Ollama might not need a real key, but OpenAI client requires one.
        baseURL: resolvedUrl
      };
    }

    // Otherwise, use the user's key for the default URL, or fallback to our server's key
    return {
      apiKey: customConfig?.apiKey || this.apiKey,
      baseURL: defaultUrl
    };
  }

  public getChatAgent(customConfig?: { apiKey?: string; baseURL?: string }): ChatAgent {
     const creds = this.resolveCredentials(customConfig);
     return new ChatAgent(creds.apiKey, creds.baseURL);
  }

  public getQuestionAgent(customConfig?: { apiKey?: string; baseURL?: string }): QuestionAgent {
     const creds = this.resolveCredentials(customConfig);
     return new QuestionAgent(creds.apiKey, creds.baseURL);
  }

  public getLocateAgent(customConfig?: { apiKey?: string; baseURL?: string }): LocateAgent {
     const creds = this.resolveCredentials(customConfig);
     return new LocateAgent(creds.apiKey, creds.baseURL);
  }

  public getCourseBuilderAgent(customConfig?: { apiKey?: string; baseURL?: string }): CourseBuilderAgent {
     const creds = this.resolveCredentials(customConfig);
     return new CourseBuilderAgent(creds.apiKey, creds.baseURL);
  }

  // Legacy Methods to support old API structure
  async generateKnowledgeGraph(
    text: string,
    customConfig?: { apiKey?: string; baseURL?: string; model?: string },
  ): Promise<{ nodes: any[]; links: any[] }> {
    const client = this.getClient(customConfig);
    if (!client) {
      this.logger.log('Using Mock DeepSeek API for Knowledge Graph generation.');
      await new Promise((r) => setTimeout(r, 1500));
      return {
        nodes: [
          { id: '人工智能', group: 1, size: 30, val: 5 },
          { id: '机器学习', group: 2, size: 25, val: 4 },
          { id: '深度学习', group: 2, size: 20, val: 3 },
          { id: '神经网络', group: 3, size: 20, val: 3 },
        ],
        links: [
          { source: '人工智能', target: '机器学习', value: 2 },
          { source: '机器学习', target: '深度学习', value: 3 },
          { source: '深度学习', target: '神经网络', value: 4 },
        ],
      };
    }

    const prompt = `分析以下文本，提取核心概念，并生成一个知识图谱。
要求返回严格的JSON格式：
{
  "nodes": [ {"id": "概念名", "group": 1, "size": 20, "val": 3, "description": "简短描述"} ],
  "links": [ {"source": "源概念", "target": "目标概念", "value": 2} ]
}

文本:
${text.substring(0, 4000)}
`;

    const response = await client.chat.completions.create({
      model: customConfig?.model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"nodes":[], "links":[]}';
    try {
      return JSON.parse(content);
    } catch (e) {
      this.logger.error('Failed to parse JSON from AI', content);
      return { nodes: [], links: [] };
    }
  }

  async generateFlashcards(
    nodeName: string,
    context: string,
    customConfig?: { apiKey?: string; baseURL?: string; model?: string },
  ): Promise<any[]> {
    return this.getQuestionAgent(customConfig).process({ nodeName, context });
  }

  async socraticTutor(
    userMessage: string,
    history: any[],
    context: string,
    customConfig?: { apiKey?: string; baseURL?: string; model?: string },
  ): Promise<string> {
    const chatAgent = this.getChatAgent(customConfig);
    const result = await chatAgent.process({ message: userMessage, history, context });
    return result.reply;
  }
}
