import { BaseAgent } from '../core/base-agent';
import { Logger } from '@nestjs/common';

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
  private readonly logger = new Logger(CourseBuilderAgent.name);

  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  // Multi-Agent Pipeline: 1. Extract 2. Architect (Edges) 3. Critic (Validate DAG & Add MicroLessons)
  async process(input: { text: string; deckId?: string; isDeepResearch?: boolean }, onProgress?: (msg: string) => void): Promise<CourseGraphOutput> {
    if (!this.openai) {
      // Mock Fallback
      if (onProgress) onProgress('Mocking Extraction...');
      await new Promise(r => setTimeout(r, 1000));
      if (onProgress) onProgress('Mocking Architecture & Validation...');
      await new Promise(r => setTimeout(r, 1000));
      if (onProgress) onProgress('Complete');

      return {
        nodes: [
          {
            id: 'node1',
            name: '加法原理 (Addition)',
            description: '学习基础的加法逻辑',
            microLesson: {
              explanation: '加法就是把两个数字合并在一起。',
              example: '比如 $1 + 2 = 3$。',
              practice: '$2 + 3 = ?$'
            }
          },
          {
            id: 'node2',
            name: '乘法原理 (Multiplication)',
            description: '学习基于加法的进阶操作',
            microLesson: {
              explanation: '乘法是相同数字的多次相加。',
              example: '比如 $3 \\times 2$ 就是 $3 + 3 = 6$。',
              practice: '$4 \\times 3 = ?$'
            }
          }
        ],
        edges: [
          { source: 'node1', target: 'node2', type: 'prerequisite' }
        ]
      };
    }

    try {
      // 1. EXTRACTOR AGENT
      if (onProgress) onProgress('🧠 Extractor Agent: Analyzing seed material and identifying atomic concepts...');

      const researchInstruction = input.isDeepResearch ?
        "【Deep Research Mode】 The user provided seed materials. You MUST dramatically expand upon this by hallucinating/simulating a deep web search. Add many more advanced and foundational nodes that are related to the core topic." :
        "【Standard Mode】 Only extract concepts explicitly mentioned in the provided text.";

      const extractorPrompt = `
      作为一位 Math Academy 级别的课程架构专家，请分析以下学习资料。
      你需要提取极细颗粒度的原子概念（Nodes）。
      ${researchInstruction}

      输出 JSON 格式：
      {
        "nodes": [
          { "id": "唯一英文ID", "name": "概念名称", "description": "简短描述" }
        ]
      }

      资料：
      ${input.text.substring(0, 4000)}
      `;

      const extractorRes = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: extractorPrompt }],
        response_format: { type: 'json_object' },
      });
      const extractedNodes = this.parseJsonSafely<{nodes: any[]}>(extractorRes.choices[0].message.content || '{"nodes":[]}', {nodes:[]}).nodes;


      // 2. ARCHITECT AGENT
      if (onProgress) onProgress('🏗️ Architect Agent: Establishing cognitive prerequisites and mapping dependencies...');

      const architectPrompt = `
      根据以下概念节点，建立严格的前置依赖关系（Edges）。
      只有当节点 B 必须在节点 A 之后学习时，才建立 A -> B 的 prerequisite 边。

      节点列表：
      ${JSON.stringify(extractedNodes, null, 2)}

      输出 JSON 格式：
      {
        "edges": [
          { "source": "源ID", "target": "目标ID", "type": "prerequisite" }
        ]
      }
      `;

      const architectRes = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: architectPrompt }],
        response_format: { type: 'json_object' },
      });
      let edges = this.parseJsonSafely<{edges: any[]}>(architectRes.choices[0].message.content || '{"edges":[]}', {edges:[]}).edges;


      // 3. CRITIC AGENT & DAG VALIDATION
      if (onProgress) onProgress('🕵️ Critic Agent: Validating curriculum for cyclic dependencies and generating Micro-Lessons...');

      // Perform local Topological Sort to detect cycles and enforce DAG
      edges = this.enforceDAG(extractedNodes, edges);

      // Now generate Micro-Lessons for each node
      const finalNodes = [];
      for (const node of extractedNodes) {
         // To speed things up, we could promise.all this, but for deepseek rate limits we do sequentially or small batches.
         // For MVP, we do one big call to generate lessons to save time.
      }

      const lessonPrompt = `
      为以下所有的学习节点生成“微课三件套”。
      请使用 Markdown 和 LaTeX 数学公式（用 $ $ 包含）。

      节点列表：
      ${JSON.stringify(extractedNodes, null, 2)}

      输出 JSON 格式：
      {
        "lessons": {
          "节点ID": {
            "explanation": "最小有效讲解",
            "example": "带步骤的示例",
            "practice": "一道测试题"
          }
        }
      }
      `;

      const lessonRes = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: lessonPrompt }],
        response_format: { type: 'json_object' },
      });
      const parsedLessonsData = this.parseJsonSafely<{lessons: Record<string, any>}>(lessonRes.choices[0].message.content || '{"lessons":{}}', {lessons:{}});
      const lessonsMap = parsedLessonsData.lessons || {};

      for (const node of extractedNodes) {
         finalNodes.push({
            ...node,
            microLesson: lessonsMap[node.id] || { explanation: '暂无 (Failed to generate)', example: '暂无 (Failed to generate)', practice: '暂无 (Failed to generate)' }
         });
      }

      if (onProgress) onProgress('✅ Generation Complete!');

      return {
         nodes: finalNodes as any,
         edges: edges
      };

    } catch (error) {
       this.logger.error("Error in CourseBuilder Pipeline", error);
       throw error;
    }
  }

  /**
   * Enforces a Directed Acyclic Graph (DAG) by removing edges that cause cycles.
   * Uses Depth-First Search to detect back-edges.
   */
  private enforceDAG(nodes: any[], edges: any[]): any[] {
     const adj = new Map<string, string[]>();
     nodes.forEach(n => adj.set(n.id, []));

     const safeEdges: any[] = [];
     const visited = new Set<string>();
     const recStack = new Set<string>();

     edges.forEach(edge => {
        if (!adj.has(edge.source)) adj.set(edge.source, []);
        adj.get(edge.source)!.push(edge.target);
     });

     // A function to check if adding a target creates a cycle from the current DFS path
     const isCyclic = (curr: string, target: string, visitedNodes: Set<string>): boolean => {
         if (curr === target) return true;
         if (visitedNodes.has(curr)) return false;

         visitedNodes.add(curr);
         const neighbors = adj.get(curr) || [];
         for (const n of neighbors) {
            if (isCyclic(n, target, visitedNodes)) return true;
         }
         return false;
     };

     // Rebuild edges cautiously
     const validAdj = new Map<string, string[]>();
     nodes.forEach(n => validAdj.set(n.id, []));

     for (const edge of edges) {
        const { source, target } = edge;
        // Check if adding this edge creates a path from target back to source
        if (source === target || isCyclic(target, source, new Set())) {
           this.logger.warn(`Cycle detected! Removing invalid edge from ${source} to ${target}`);
        } else {
           safeEdges.push(edge);
           if (!validAdj.has(source)) validAdj.set(source, []);
           validAdj.get(source)!.push(target);
           // update adj to only contain safe edges moving forward
           adj.set(source, validAdj.get(source)!);
        }
     }

     return safeEdges;
  }
}
