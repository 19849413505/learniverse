import { BaseAgent } from '../core/base-agent';

export interface CourseGraphOutput {
  nodes: {
    id: string;
    name: string;
    description: string;
    microLesson: {
      explanation: string;
      example: string;
      practice: string;
    };
  }[];
  edges: {
    source: string;
    target: string;
    type: 'prerequisite' | 'encompasses';
  }[];
}

export class CourseBuilderAgent extends BaseAgent {
  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  async process(input: { text: string; deckId?: string }): Promise<CourseGraphOutput> {
    if (!this.openai) {
      await new Promise((r) => setTimeout(r, 1500));
      return {
        nodes: [
          {
            id: 'node1',
            name: '加法原理',
            description: '学习基础的加法逻辑',
            microLesson: {
              explanation: '加法就是把两个数字合并在一起。',
              example: '比如 1 个苹果加上 2 个苹果，等于 3 个苹果。',
              practice: '2 + 3 等于多少？'
            }
          },
          {
            id: 'node2',
            name: '乘法原理',
            description: '学习基于加法的进阶操作',
            microLesson: {
              explanation: '乘法是相同数字的多次相加。',
              example: '比如 3 * 2 就是 3 + 3 = 6。',
              practice: '4 * 3 等于多少？'
            }
          }
        ],
        edges: [
          { source: 'node1', target: 'node2', type: 'prerequisite' }
        ]
      };
    }

    const prompt = `
作为一位 Math Academy 级别的课程架构专家，请分析以下学习资料。
你需要将内容拆解为一个“技能树（Skill Tree）”或“知识图谱”，并为每个节点生成“微课三件套”。

要求：
1. **Nodes (节点)**：提取极细颗粒度的原子概念。每个节点包含 id, name, description。
2. **MicroLesson (微课)**：对于每个节点，提供：
   - explanation (最小有效讲解，通俗易懂)
   - example (示例引导，带详细步骤)
   - practice (即时练习题)
3. **Edges (边)**：提取节点之间的关系。只有当节点B必须在节点A之后学习时，才建立 {"source": "A", "target": "B", "type": "prerequisite"}。

请输出严格的 JSON 格式：
{
  "nodes": [
    {
      "id": "概念英文ID",
      "name": "概念名称",
      "description": "简短描述",
      "microLesson": {
        "explanation": "...",
        "example": "...",
        "practice": "..."
      }
    }
  ],
  "edges": [
    { "source": "源ID", "target": "目标ID", "type": "prerequisite" }
  ]
}

学习资料：
${input.text.substring(0, 4000)}
    `;

    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"nodes":[], "edges":[]}';
    return this.parseJsonSafely<CourseGraphOutput>(content, { nodes: [], edges: [] });
  }
}
