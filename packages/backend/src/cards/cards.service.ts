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

  async syncBatchReviews(userId: string, reviews: any[]) {
    if (!reviews || reviews.length === 0) return { count: 0 };
    if (!this.prisma.isConnected || this.prisma.isOfflineMode) {
      return { count: reviews.length, mock: true };
    }

    const updates = reviews.map(r => {
      // Create or update the CardReview state for this user & card
      return this.prisma.cardReview.upsert({
        where: {
          userId_cardId: {
            userId: userId,
            cardId: r.cardId,
          }
        },
        create: {
          userId: userId,
          cardId: r.cardId,
          due: r.due ? new Date(r.due) : new Date(),
          stability: r.stability,
          difficulty: r.difficulty,
          elapsedDays: r.elapsed_days || r.elapsedDays,
          scheduledDays: r.scheduled_days || r.scheduledDays,
          reps: r.reps,
          lapses: r.lapses,
          state: r.state,
        },
        update: {
          due: r.due ? new Date(r.due) : undefined,
          stability: r.stability,
          difficulty: r.difficulty,
          elapsedDays: r.elapsed_days || r.elapsedDays,
          scheduledDays: r.scheduled_days || r.scheduledDays,
          reps: r.reps,
          lapses: r.lapses,
          state: r.state,
        }
      });
    });

    await this.prisma.$transaction(updates);
    return { count: updates.length };
  }
}
