"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let AiService = AiService_1 = class AiService {
    configService;
    logger = new common_1.Logger(AiService_1.name);
    openai = null;
    useMock;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('DEEPSEEK_API_KEY');
        this.useMock = !apiKey;
        if (!this.useMock) {
            this.openai = new openai_1.OpenAI({
                apiKey,
                baseURL: 'https://api.deepseek.com/v1',
            });
            this.logger.log('DeepSeek AI initialized successfully.');
        }
        else {
            this.logger.warn('DEEPSEEK_API_KEY not found. Using Mock AI Service.');
        }
    }
    getClient(customConfig) {
        if (customConfig && customConfig.apiKey) {
            return new openai_1.OpenAI({
                apiKey: customConfig.apiKey,
                baseURL: customConfig.baseURL || 'https://api.deepseek.com/v1',
            });
        }
        return this.openai;
    }
    async generateKnowledgeGraph(text, customConfig) {
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
        }
        catch (e) {
            this.logger.error('Failed to parse JSON from AI', content);
            return { nodes: [], links: [] };
        }
    }
    async generateFlashcards(nodeName, context, customConfig) {
        const client = this.getClient(customConfig);
        if (!client) {
            this.logger.log(`Using Mock DeepSeek API for Flashcard generation: ${nodeName}`);
            await new Promise((r) => setTimeout(r, 1000));
            return [
                {
                    id: `card_${Date.now()}_1`,
                    front: `什么是【${nodeName}】？`,
                    back: `${nodeName} 是一种非常重要的概念，通常用于...`,
                },
                {
                    id: `card_${Date.now()}_2`,
                    front: `${nodeName} 的主要应用场景有哪些？`,
                    back: `主要应用于数据分析和自动化决策中。`,
                },
            ];
        }
        const prompt = `基于以下上下文信息，为核心概念【${nodeName}】生成记忆闪卡。\n` +
            `输出严格的JSON格式，包含一个数组对象：\n` +
            `{\n  "cards": [\n    { "front": "问题正面", "back": "答案背面" }\n  ]\n}\n` +
            `上下文: ${context}\n概念: ${nodeName}`;
        const response = await client.chat.completions.create({
            model: customConfig?.model || 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0].message.content || '{"cards":[]}';
        try {
            let parsed = JSON.parse(content);
            return parsed.cards || parsed || [];
        }
        catch (e) {
            return [];
        }
    }
    async socraticTutor(userMessage, history, context, customConfig) {
        const systemPrompt = "STRICT RULES\nBe an approachable yet dynamic teacher... DO NOT GIVE ANSWERS OR DO HOMEWORK FOR THE USER.";
        const client = this.getClient(customConfig);
        if (!client) {
            await new Promise((r) => setTimeout(r, 1000));
            return '这是一个很好的问题！但在我直接告诉你答案之前，我们先来回顾一下：根据你刚才提到的概念，你认为这两者之间最大的区别可能是什么？（别担心，说错也没关系）';
        }
        const messages = [
            { role: 'system', content: systemPrompt + '\n\nCurrent Topic Context: ' + context },
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: 'user', content: userMessage },
        ];
        const response = await client.chat.completions.create({
            model: customConfig?.model || 'deepseek-chat',
            messages: messages,
        });
        return response.choices[0].message.content || "Sorry, I couldn't process that.";
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiService);
