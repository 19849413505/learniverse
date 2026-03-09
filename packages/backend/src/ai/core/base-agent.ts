import { OpenAI } from 'openai';

export abstract class BaseAgent {
  protected openai: OpenAI | null;

  constructor(protected readonly apiKey?: string, protected readonly baseURL?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: baseURL || 'https://api.deepseek.com/v1',
      });
    } else {
      this.openai = null;
    }
  }

  /**
   * Helper function to safely parse JSON returned from the LLM.
   */
  protected parseJsonSafely<T>(content: string, fallback: T): T {
    try {
      // Sometimes LLMs wrap JSON in markdown blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanContent) as T;
    } catch (e) {
      console.error('Failed to parse JSON from Agent:', content);
      return fallback;
    }
  }

  /**
   * The core method every agent must implement.
   */
  abstract process(input: any, context?: any): Promise<any>;
}
