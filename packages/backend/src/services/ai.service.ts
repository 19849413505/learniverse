import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// We use OpenAI's client to connect to DeepSeek, as DeepSeek provides an OpenAI-compatible API.
// If DeepSeek API key is not present, we will simulate it for MVP testing purposes.
const USE_MOCK = !process.env.DEEPSEEK_API_KEY;

let openai: OpenAI | null = null;
if (!USE_MOCK) {
  openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1', // DeepSeek compatible endpoint
  });
}

export class AIService {

  private getClient(customConfig?: { apiKey?: string, baseURL?: string }): OpenAI | null {
    if (customConfig && customConfig.apiKey) {
      return new OpenAI({
        apiKey: customConfig.apiKey,
        baseURL: customConfig.baseURL || 'https://api.deepseek.com/v1',
      });
    }
    return openai;
  }

  // 1. Generate Knowledge Graph from raw text
  async generateKnowledgeGraph(text: string, customConfig?: { apiKey?: string, baseURL?: string, model?: string }): Promise<{ nodes: any[], links: any[] }> {
    const client = this.getClient(customConfig);
    if (!client) {
      console.log('Using Mock DeepSeek API for Knowledge Graph generation.');
      await new Promise(r => setTimeout(r, 1500));
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
        ]
      };
    }

    const prompt = `分析以下文本，提取核心概念，并生成一个知识图谱。
要求返回严格的JSON格式：
{
  "nodes": [ {"id": "概念名", "group": 1, "size": 20, "val": 3, "description": "简短描述"} ],
  "links": [ {"source": "源概念", "target": "目标概念", "value": 2} ]
}

文本:
${text.substring(0, 4000)} // Truncate for token limits
`;

    const response = await client.chat.completions.create({
      model: customConfig?.model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{"nodes":[], "links":[]}';
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from AI", content);
      return { nodes: [], links: [] };
    }
  }

  // 2. Dynamically Generate Flashcards for a SPECIFIC NODE
  async generateFlashcards(nodeName: string, context: string, customConfig?: { apiKey?: string, baseURL?: string, model?: string }): Promise<any[]> {
    const client = this.getClient(customConfig);
    if (!client) {
      console.log(`Using Mock DeepSeek API for Flashcard generation for node: ${nodeName}`);
      await new Promise(r => setTimeout(r, 1000));
      return [
        {
          id: `card_${Date.now()}_1`,
          front: `什么是【${nodeName}】？`,
          back: `${nodeName} 是一种非常重要的概念，通常用于...`
        },
        {
           id: `card_${Date.now()}_2`,
           front: `${nodeName} 的主要应用场景有哪些？`,
           back: `主要应用于数据分析和自动化决策中。`
        }
      ];
    }

    const prompt = "基于以下上下文信息，为核心概念【" + nodeName + "】生成记忆闪卡。\n" +
"你必须严格遵循以下SuperMemo的20条原则来生成卡片：\n" +
"1. 不要在没有理解之前开始学习，也不要在没有理解之前尝试记忆。\n" +
"2. 先学核心再学细节：在建立完整的知识框架之前，不要盲目记忆细节。\n" +
"3. 基于你的知识体系：学习必须建立在已知之上。卡片需要和学习者原有的知识结构相关联。\n" +
"4. 坚持最小信息原则：\n" +
"    • 卡片上的信息必须尽可能的简短，必须满足：\n" +
"        1. 容易回忆。\n" +
"        2. 容易复习。\n" +
"5. 填空型问题总是有效：如果使用最小信息原则依然很难表述，可以尝试挖空式。将一段信息中的重要单词挖去，留下足够线索。\n" +
"6. 善用图像：视觉皮层经过漫长的进化，处理图形信息的能力极强。使用图片辅助记忆（如果适用）。\n" +
"7. 图像与挖空测验：可以通过遮挡图片的一部分来测试（如果适用）。\n" +
"8. 避免集合，远离枚举：不要创建需要回答一组项目（如“X包含哪些A, B, C”）的卡片。如果不可避免，拆分成单独测试或使用辅助手段。\n" +
"9. 避免集合，尝试转换枚举：将枚举信息转化为包含有意义叙述、逻辑线索的卡片。\n" +
"10. 避免集合，善用提示：对于不可避免的集合记忆，在问题中包含提示信息或首字母缩写。\n" +
"11. 应对集合的终极武器是使用挖空测验的叠加：将集合拆解成循序渐进的多个填空。\n" +
"12. 优化措辞：卡片的文字应极尽精炼，用最少的词语表达确切含义，提高复习速度。\n" +
"13. 建立与其他记忆材料的联系：在卡片中提供上下文、记忆口诀或与其他卡片的关联。\n" +
"14. 个性化你的卡片：与你的生活、经验、兴趣相关联的内容，更容易被记住。\n" +
"15. 依赖情绪状态：利用情绪（幽默、惊奇等）辅助记忆，虽然在AI生成中不强求，但尽量让内容生动。\n" +
"16. 提供上下文：使用一致的标签或上下文前缀（例如在前端加上学科缩写），帮助大脑快速定位知识所属领域。\n" +
"17. 冗余不等于重复：可以从不同角度测试同一个知识点，创建多张卡片，加深理解而不是单一死记硬背。\n" +
"18. 提供记忆线索：如提供首字母，帮助回答问题。\n" +
"19. 给定源头：如果可能，标记信息来源以增加可信度和后续查找便利。\n" +
"20. 提供时间戳：对于容易变化的信息（如人口），标注时间（当前不需要）。\n" +
"\n" +
"输出严格的JSON格式，包含一个数组对象：\n" +
"{\n" +
"  \"cards\": [\n" +
"    { \"front\": \"问题正面\", \"back\": \"答案背面\" }\n" +
"  ]\n" +
"}\n" +
"\n" +
"上下文: " + context + "\n" +
"概念: " + nodeName;

    const response = await client.chat.completions.create({
      model: customConfig?.model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' } // Using json_object might require wrapping in an object, but we'll try array or wrap it
    });

    // Deepseek expects { ... } for json_object, so we should actually prompt for an object containing an array.
    // Modifying prompt strictly for object response if required by DeepSeek json mode.
    // But since the code above is already written, let's fix the mock logic and assume standard parsing.

    const content = response.choices[0].message.content || '{"cards":[]}';
    try {
      let parsed = JSON.parse(content);
      return parsed.cards || parsed || [];
    } catch (e) {
      return [];
    }
  }

  // 3. Socratic Tutor (Archimedes Mode) - STRICT RULES APPLIED
  async socraticTutor(userMessage: string, history: any[], context: string, customConfig?: { apiKey?: string, baseURL?: string, model?: string }): Promise<string> {
    const systemPrompt = "STRICT RULES\n" +
"Be an approachable yet dynamic teacher, who helps the user learn by guiding them through their studies.\n" +
"\n" +
"Get to know the user. If you don't know their goals or grade level, ask the user before diving in. (Keep this lightweight!) If they don't answer, aim for explanations that would make sense to a 10th grade student.\n" +
"Build on existing knowledge. Connect new ideas to what the user already knows.\n" +
"Guide users, don't just give answers. Use questions, hints, and small steps so the user discovers the answer for themselves.\n" +
"Check and reinforce. After hard parts, confirm the user can restate or use the idea. Offer quick summaries, mnemonics, or minireviews to help the ideas stick.\n" +
"Vary the rhythm. Mix explanations, questions, and activities (like roleplaying, practice rounds, or asking the user to teach you) so it feels like a conversation, not a lecture.\n" +
"Above all: DO NOT DO THE USER'S WORK FOR THEM. Don't answer homework questions — help the user find the answer, by working with them collaboratively and building from what they already know.\n" +
"\n" +
"THINGS YOU CAN DO\n" +
"Teach new concepts: Explain at the user's level, ask guiding questions, use visuals, then review with questions or a practice round.\n" +
"Help with homework: Don't simply give answers! Start from what the user knows, help fill in the gaps, give the user a chance to respond, and never ask more than one question at a time.\n" +
"Practice together: Ask the user to summarize, pepper in little questions, have the user \"explain it back\" to you, or roleplay. Correct mistakes — charitably! — in the moment.\n" +
"Quizzes & test prep: Run practice quizzes. (One question at a time!) Let the user try twice before you reveal answers, then review errors in depth.\n" +
"\n" +
"TONE & APPROACH\n" +
"Be warm, patient, and plainspoken; don't use too many exclamation marks or emoji. Keep the session moving: always know the next step, and switch or end activities once they've done their job. And be brief — don't ever send essaylength responses. Aim for a good backandforth.\n" +
"\n" +
"IMPORTANT\n" +
"DO NOT GIVE ANSWERS OR DO HOMEWORK FOR THE USER. If the user asks a math or logic problem, DO NOT SOLVE IT in your first response. Instead: talk through the problem with the user, one step at a time, asking a single question at each step, and give the user a chance to RESPOND TO EACH STEP before continuing.";

    const client = this.getClient(customConfig);
    if (!client) {
       await new Promise(r => setTimeout(r, 1000));
       return "这是一个很好的问题！但在我直接告诉你答案之前，我们先来回顾一下：根据你刚才提到的概念，你认为这两者之间最大的区别可能是什么？（别担心，说错也没关系）";
    }

    const messages = [
      { role: 'system', content: systemPrompt + "\n\nCurrent Topic Context: " + context },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ] as any;

    const response = await client.chat.completions.create({
      model: customConfig?.model || 'deepseek-chat',
      messages: messages,
    });

    return response.choices[0].message.content || "Sorry, I couldn't process that.";
  }
}
