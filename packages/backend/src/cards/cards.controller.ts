import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CardsService } from './cards.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  async createCard(@Body() body: { front: string; back: string; sourceNode?: string }) {
    return this.cardsService.createFlashcard(body);
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
}
