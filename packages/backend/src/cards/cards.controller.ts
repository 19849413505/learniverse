import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CardsService } from './cards.service';
import { AiService } from '../ai/ai.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Cards & Question Generator')
@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async createCard(@Body() body: { front: string; back: string; sourceNode?: string }) {
    return this.cardsService.createFlashcard(body);
  }

  @Post('generate-mimic')
  async generateMimicCards(
    @Body() body: { nodeName: string; context: string; difficulty?: string; count?: number; referenceFormat?: string; customConfig?: any }
  ) {
    const questions = await this.aiService.getQuestionAgent(body.customConfig).process(body);

    // Auto-save generated questions to database as Flashcards
    const savedCards = [];
    for (const q of questions) {
      if (q.front && q.back) {
        const card = await this.cardsService.createFlashcard({
          front: q.front,
          back: q.back,
          sourceNode: body.nodeName,
        });
        savedCards.push({ ...card, relevance: q.relevance });
      }
    }
    return { generated: savedCards.length, cards: savedCards };
  }

  @Get()
  async getAllCards() {
    return this.cardsService.getAllFlashcards();
  }

  @Post('review/:userId/:cardId')
  async assignCardToUser(
    @Param('userId') userId: string,
    @Param('cardId') cardId: string,
  ) {
    return this.cardsService.createReviewState(userId, cardId);
  }

  @Get('due/:userId')
  async getDueCards(@Param('userId') userId: string) {
    return this.cardsService.getUserDueCards(userId);
  }

  @Post('review-update/:reviewId')
  async updateReviewState(
     @Param('reviewId') reviewId: string,
     @Body() updateData: any // Coming from ts-fsrs (snake_case)
  ) {
     // Map ts-fsrs snake_case properties to Prisma camelCase schema
     const prismaData = {
        due: updateData.due,
        stability: updateData.stability,
        difficulty: updateData.difficulty,
        elapsedDays: updateData.elapsed_days,
        scheduledDays: updateData.scheduled_days,
        reps: updateData.reps,
        lapses: updateData.lapses,
        state: updateData.state,
     };
     return this.cardsService.updateReviewState(reviewId, prismaData);
  }
}
