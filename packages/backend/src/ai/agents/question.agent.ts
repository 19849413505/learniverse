import { BaseAgent } from '../core/base-agent';

export class QuestionAgent extends BaseAgent {
  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  /**
   * Generates FSRS flashcards (mimic or custom).
   */
  async process(
    input: { nodeName: string; context: string; difficulty?: string; count?: number; referenceFormat?: string },
  ): Promise<any[]> {
    const { nodeName, context, difficulty = 'medium', count = 3, referenceFormat } = input;

    if (!this.openai) {
      // MOCK
      await new Promise((r) => setTimeout(r, 1000));
      return Array.from({ length: count }).map((_, i) => ({
        id: `card_${Date.now()}_${i}`,
        front: `什么是【${nodeName}】？（难度：${difficulty}）`,
        back: `${nodeName} 是一种非常重要的概念，通常用于... 详细解释.`,
        relevance: 0.95, // DeepTutor-style validation score
      }));
    }

    let prompt = `基于以下上下文信息，为核心概念【${nodeName}】生成 ${count} 张适合间隔重复(FSRS)记忆的闪卡。\n`;

    if (referenceFormat) {
       prompt += `\n你必须严格模仿以下参考题目的风格和题型结构：\n${referenceFormat}\n`;
    }

    prompt += `
要求难度：${difficulty}。
必须严格遵循 SuperMemo 的 20 条原则：
- 坚持最小信息原则
- 善用填空测验
- 避免集合枚举，转换成逻辑线索
- 个性化，提供上下文或记忆线索

输出严格的JSON格式，包含一个数组对象：
{
  "cards": [
    {
      "front": "问题正面",
      "back": "答案背面",
      "relevance": 0.95 // 对知识点考察的相关性评分(0-1)
    }
  ]
}

上下文: ${context}
概念: ${nodeName}`;

    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"cards":[]}';
    const parsed = this.parseJsonSafely<{ cards: any[] }>(content, { cards: [] });

    // Validate relevance (DeepTutor Question Validation Concept)
    return parsed.cards.filter((card) => (card.relevance || 1.0) > 0.6);
  }
}
