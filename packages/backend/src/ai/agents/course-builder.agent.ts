import { BaseAgent } from '../core/base-agent';

export interface CourseGraphOutput {
  nodes: {
    id: string;
    name: string;
    description: string;
    difficulty_level: 'memory' | 'understanding' | 'application'; // 认知层级
    roleplay_hook?: string; // 结合导师人设的切入点
    microLesson: {
      steps: {
        step_type: 'intro' | 'example' | 'guided_practice' | 'independent_practice';
        content: string;
      }[];
    };
  }[];
  edges: {
    source: string;
    target: string;
    type: 'prerequisite' | 'encompasses' | 'related'; // 包含关系与相关性
  }[];
  diagnostic_questions: {
    question: string;
    answer: string;
    tests_node_id: string; // 关联的中心枢纽节点
  }[];
}

export class CourseBuilderAgent extends BaseAgent {
  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  async process(input: { text: string; deckId?: string; tutorPrompt?: string }): Promise<CourseGraphOutput> {
    if (!this.openai) {
      await new Promise((r) => setTimeout(r, 1500));
      return {
        nodes: [
          {
            id: 'node1',
            name: '加法原理',
            description: '学习基础的加法逻辑',
            difficulty_level: 'memory',
            roleplay_hook: '如果把苹果换成亮闪闪的星琼，你能算出来吗？',
            microLesson: {
              steps: [
                { step_type: 'intro', content: '加法就是把两个数字合并在一起。' },
                { step_type: 'example', content: '比如 1 个星琼加上 2 个星琼，等于 3 个星琼。' },
                { step_type: 'independent_practice', content: '2 + 3 等于多少？' }
              ]
            }
          },
          {
            id: 'node2',
            name: '乘法原理',
            description: '学习基于加法的进阶操作',
            difficulty_level: 'understanding',
            roleplay_hook: '你如果每天给仙舟跑腿送3次快递，2天能送几次呢？',
            microLesson: {
              steps: [
                { step_type: 'intro', content: '乘法是相同数字的多次相加。' },
                { step_type: 'example', content: '比如 3 * 2 就是 3 + 3 = 6。' },
                { step_type: 'independent_practice', content: '4 * 3 等于多少？' }
              ]
            }
          }
        ],
        edges: [
          { source: 'node1', target: 'node2', type: 'prerequisite' }
        ],
        diagnostic_questions: [
          { question: '2 + 3 等于多少？', answer: '5', tests_node_id: 'node1' }
        ]
      };
    }

    // 分块处理 (Chunking) 以支持长文本。这里简化处理，将文本按 4000 字分块，循环生成后合并。
    // 在更复杂的生产系统中，应当使用层次化摘要 (Hierarchical Chunking)。
    const chunkSize = 4000;
    const chunks: string[] = [];
    for (let i = 0; i < input.text.length; i += chunkSize) {
      chunks.push(input.text.substring(i, i + chunkSize));
    }

    const mergedOutput: CourseGraphOutput = { nodes: [], edges: [], diagnostic_questions: [] };

    // 处理导师特定提示词 (创意工坊)
    const workshopPrompt = input.tutorPrompt
      ? `\n【创意工坊 - 教师人设与特殊要求】\n你需要扮演或结合以下导师设定来设计部分内容（特别是 roleplay_hook）：\n"${input.tutorPrompt}"\n`
      : '';

    for (const chunk of chunks) {
      const prompt = `
作为一位 Math Academy 级别的课程架构专家，请分析以下学习资料切片。
你需要将内容拆解为符合“深度精熟学习”理念的“技能树（Skill Tree）”或“知识图谱”，并为每个概念生成微课支架与诊断题。
${workshopPrompt}
要求：
1. **Nodes (节点)**：提取极细颗粒度的原子概念。
   - difficulty_level: 评估该节点属于 'memory'(记忆), 'understanding'(理解), 还是 'application'(应用)。
   - roleplay_hook: 如果有导师人设，请生成一句极具人设口吻的引入语，将枯燥概念与生活/游戏联系起来。否则留空。
   - microLesson.steps: 生成分步认知脚手架。包含 'intro'(引入), 'example'(示例引导), 'guided_practice'(带提示的练习), 'independent_practice'(独立练习)。不用全写，但至少要有 intro 和 independent_practice。
2. **Edges (边)**：提取节点之间的关系。
   - 'prerequisite': B必须在A之后学习。
   - 'encompasses': A(高级)包含了B(低级)，复习A时等同于复习B。
   - 'related': 相关但不构成严格前后置关系。
3. **Diagnostic Questions (诊断题)**：针对核心枢纽节点，生成 1-2 道测试题，用于在学习前测定学生是否已掌握该节点，若是，则可以跳过。

请输出严格的 JSON 格式：
{
  "nodes": [
    {
      "id": "概念英文ID",
      "name": "概念名称",
      "description": "简短描述",
      "difficulty_level": "understanding",
      "roleplay_hook": "...",
      "microLesson": {
        "steps": [
          { "step_type": "intro", "content": "..." },
          { "step_type": "independent_practice", "content": "..." }
        ]
      }
    }
  ],
  "edges": [
    { "source": "源ID", "target": "目标ID", "type": "prerequisite" }
  ],
  "diagnostic_questions": [
    { "question": "问题内容", "answer": "简短答案", "tests_node_id": "关联的中心节点ID" }
  ]
}

学习资料：
${chunk}
      `;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat', // 使用兼容的低成本大模型
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{"nodes":[], "edges":[], "diagnostic_questions": []}';
      const parsed = this.parseJsonSafely<CourseGraphOutput>(content, { nodes: [], edges: [], diagnostic_questions: [] });

      // 合并结果
      mergedOutput.nodes.push(...(parsed.nodes || []));
      mergedOutput.edges.push(...(parsed.edges || []));
      mergedOutput.diagnostic_questions.push(...(parsed.diagnostic_questions || []));
    }

    // 后处理：移除可能重复的节点、边（基于ID去重）
    mergedOutput.nodes = Array.from(new Map(mergedOutput.nodes.map(item => [item.id, item])).values());
    mergedOutput.edges = mergedOutput.edges.filter((edge, index, self) =>
      index === self.findIndex((t) => t.source === edge.source && t.target === edge.target && t.type === edge.type)
    );

    return mergedOutput;
  }
}
