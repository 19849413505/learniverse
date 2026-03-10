import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags } from '@nestjs/swagger';
import { PersonaConfig } from './agents/chat.agent';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Knowledge & AI')
@Controller()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService
  ) {}

  @Post('knowledge/graph')
  async generateGraph(@Body() body: { text: string; customConfig?: any }) {
    if (!body.text) {
      return { error: 'Text content is required' };
    }
    return this.aiService.generateKnowledgeGraph(body.text, body.customConfig);
  }

  @Post('knowledge/cards')
  async generateCards(@Body() body: { nodeName: string; nodeContext?: string; customConfig?: any }) {
    if (!body.nodeName) {
      return { error: 'nodeName is required' };
    }
    const questions = await this.aiService.generateFlashcards(
      body.nodeName,
      body.nodeContext || '',
      body.customConfig,
    );

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
