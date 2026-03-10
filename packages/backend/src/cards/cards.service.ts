import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Flashcard, CardReview } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async createFlashcard(data: { front: string; back: string; sourceNode?: string }): Promise<Flashcard> {
    return this.prisma.flashcard.create({
      data,
    });
  }

  // ⚡ Bolt: Batch insert flashcards to avoid N+1 queries
  // Uses modern createManyAndReturn to get exact inserted rows instantly without duplicate risks
  async createManyFlashcards(data: { front: string; back: string; sourceNode?: string }[]) {
    return this.prisma.flashcard.createManyAndReturn({
      data,
      skipDuplicates: true,
    });
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    return this.prisma.flashcard.findMany();
  }

  // Assign a card to a user with initial FSRS state
  async createReviewState(userId: string, cardId: string): Promise<CardReview> {
    return this.prisma.cardReview.create({
      data: {
        userId,
        cardId,
        // Default FSRS Initial Values
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: 0, // New
      },
    });
  }

  async getUserDueCards(userId: string): Promise<CardReview[]> {
    const now = new Date();
    return this.prisma.cardReview.findMany({
      where: {
        userId,
        due: {
          lte: now, // lte = less than or equal to current time
        },
      },
      include: {
        card: true,
      },
      orderBy: {
        due: 'asc',
      },
    });
  }

  async updateReviewState(id: string, updateData: Partial<CardReview>): Promise<CardReview> {
     return this.prisma.cardReview.update({
       where: { id },
       data: updateData,
     });
  }
}
