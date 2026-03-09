import { BaseAgent } from '../core/base-agent';

export interface PersonaConfig {
  name: string;
  personality: string;
  voiceStyle?: string;
}

export class ChatAgent extends BaseAgent {
  constructor(apiKey?: string, baseURL?: string) {
    super(apiKey, baseURL);
  }

  async process(
    input: { message: string; history: any[]; context: string; persona?: PersonaConfig },
  ): Promise<{ reply: string; ttsScript?: string }> {
    const defaultPersona = "You are an approachable yet dynamic teacher, guiding users through their studies with Socratic questions. NEVER give the direct answer.";
    const personaInstruction = input.persona
      ? `You are playing the role of ${input.persona.name}. Your personality is: ${input.persona.personality}. ALWAYS stay in character. Speak naturally.`
      : defaultPersona;

    const systemPrompt = `
STRICT RULES
${personaInstruction}
Get to know the user. Build on existing knowledge. Guide users, don't just give answers.
Use questions, hints, and small steps. DO NOT DO THE USER'S WORK FOR THEM.

Context: ${input.context}
    `;

    if (!this.openai) {
      // MOCK
      await new Promise((r) => setTimeout(r, 1000));
      return {
        reply: `(${input.persona?.name || 'Socrates'}) 这是一个很好的问题！但在我直接告诉你答案之前，我们先来回顾一下，你认为这两者之间最大的区别可能是什么？`,
        ttsScript: "这是一个很好的问题！但在我直接告诉你答案之前，我们先来回顾一下，你认为这两者之间最大的区别可能是什么？",
      };
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...input.history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: input.message },
    ] as any;

    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages,
    });

    const replyText = response.choices[0].message.content || '...';

    // In a real implementation, we could ask the LLM to output JSON with { textToUser, textToSpeechScript }
    // For now, we return the same string for both.
    return {
      reply: replyText,
      ttsScript: replyText.replace(/[\*\_\[\]\(\)]/g, ''), // Strip markdown for TTS
    };
  }
}
