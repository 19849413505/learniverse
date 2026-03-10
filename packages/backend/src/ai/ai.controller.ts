import { Controller, Post, Body, Inject } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags } from '@nestjs/swagger';
import { PersonaConfig } from './agents/chat.agent';
import { PrismaService } from '../prisma/prisma.service';
import { Throttle } from '@nestjs/throttler';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@ApiTags('Knowledge & AI')
@Controller()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  private hashKey(prefix: string, content: string): string {
    return `${prefix}:${crypto.createHash('md5').update(content).digest('hex')}`;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @Post('knowledge/graph')
  async generateGraph(@Body() body: { text: string; customConfig?: any }) {
    if (!body.text) {
      return { error: 'Text content is required' };
    }

    const cacheKey = this.hashKey('graph', body.text);
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.aiService.generateKnowledgeGraph(body.text, body.customConfig);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @Post('knowledge/cards')
  async generateCards(@Body() body: { nodeName: string; nodeContext?: string; customConfig?: any }) {
    if (!body.nodeName) {
      return { error: 'nodeName is required' };
    }

    const contextHash = body.nodeContext ? crypto.createHash('md5').update(body.nodeContext).digest('hex') : 'no-ctx';
    const cacheKey = `cards:${body.nodeName}:${contextHash}`;

    let questions: any = await this.cacheManager.get(cacheKey);

    if (!questions) {
      questions = await this.aiService.generateFlashcards(
        body.nodeName,
        body.nodeContext || '',
        body.customConfig,
      );
      // We purposefully only cache the questions themselves, not the generated Mock DB IDs
      await this.cacheManager.set(cacheKey, questions, 3600000); // 1 hr cache
    }

    // Auto-save generated questions to database as Flashcards
    const savedCards = [];
    for (const q of questions) {
      if (q.front && q.back) {
        if (!this.prisma.isConnected || this.prisma.isOfflineMode) {
          // If offline/mock DB mode, just return the generated card with a mock ID
          savedCards.push({
            id: `mock-card-${Math.random().toString(36).substr(2, 9)}`,
            front: q.front,
            back: q.back,
            sourceNode: body.nodeName,
            relevance: q.relevance,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          try {
            const card = await this.prisma.flashcard.create({
              data: {
                front: q.front,
                back: q.back,
                sourceNode: body.nodeName,
              }
            });
            savedCards.push({ ...card, relevance: q.relevance });
          } catch (e) {
            // gracefully fallback if db fails mid-generation
            savedCards.push({
              id: `mock-card-${Math.random().toString(36).substr(2, 9)}`,
              front: q.front,
              back: q.back,
              sourceNode: body.nodeName,
              relevance: q.relevance,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    }

    return { cards: savedCards };
  }

  @Post('archimedes/chat')
  async chatTutor(
    @Body() body: { message: string; history?: any[]; context?: string; persona?: PersonaConfig; customConfig?: any },
  ) {
    if (!body.message) {
      return { error: 'message is required' };
    }
    const result = await this.aiService.getChatAgent(body.customConfig).process({
      message: body.message,
      history: body.history || [],
      context: body.context || '',
      persona: body.persona,
    });

    return {
      reply: result.reply,
      ttsScript: result.ttsScript,
      persona: body.persona?.name || 'Socrates'
    };
  }

  @Post('guide/locate')
  async locateKnowledgePoints(
    @Body() body: { text: string; customConfig?: any },
  ) {
     if (!body.text) {
        return { error: 'Text content is required' };
     }
     const points = await this.aiService.getLocateAgent(body.customConfig).process({ text: body.text });
     return { points };
  }
}
