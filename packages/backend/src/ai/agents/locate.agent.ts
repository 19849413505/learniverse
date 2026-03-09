import { BaseAgent } from '../core/base-agent';

export class LocateAgent extends BaseAgent {
  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  /**
   * Identifies 3-5 progressive knowledge points from raw text (Guided Learning).
   */
  async process(input: { text: string }): Promise<string[]> {
    if (!this.openai) {
      await new Promise((r) => setTimeout(r, 1000));
      return ["1. 基础概念引入", "2. 核心原理拆解", "3. 实践案例分析"];
    }

    const prompt = `
作为一位教学架构师(LocateAgent)，请分析以下学习资料。
将内容拆解为 3-5 个循序渐进的核心知识点（用于后续引导式教学的关卡）。
确保：
1. 从基础到进阶
2. 每个知识点能用 1-2 句话讲清楚
3. 严格输出 JSON 数组格式 ["概念A", "概念B", "概念C"]

学习资料:
${input.text.substring(0, 3000)}
    `;

    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"points":[]}';
    try {
        const parsed = JSON.parse(content);
        return parsed.points || Object.values(parsed)[0] || [];
    } catch {
        return [];
    }
  }
}
