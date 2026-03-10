import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, name?: string, id?: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        id, // if provided, use it (e.g. 'demo-user-id'), otherwise prisma defaults to uuid()
        email,
        name,
      },
    });
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        cardReviews: true, // Includes their learning progress
        nodeProgress: true, // Includes skill tree progress
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as any; // Cast to bypass strict User type from Prisma client which doesn't reflect the dynamic include
  }

  async getUserAnalytics(id: string) {
    const user: any = await this.getUserById(id);

    // Process Node Progress to generate Forgetting Curve / Review Heatmap data
    const nodes = user.nodeProgress || [];

    // Calculate FSRS statistics
    let totalReviews = 0;
    let averageStability = 0;
    let upcomingReviews = 0;

    const now = new Date();
    const stabilityData = [];

    for (const node of nodes) {
      if (node.reps) totalReviews += node.reps;

      if (node.stability !== null && node.stability !== undefined) {
        averageStability += node.stability;
        stabilityData.push({
           nodeId: node.nodeId,
           stability: node.stability,
           difficulty: node.difficulty,
           reps: node.reps
        });
      }

      if (node.due && new Date(node.due) <= now) {
        upcomingReviews++;
      }
    }

    if (stabilityData.length > 0) {
      averageStability /= stabilityData.length;
    }

    // Mock 7-day XP activity history since we don't track daily XP in the schema directly yet
    const xpHistory = Array.from({length: 7}).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        xp: Math.floor(Math.random() * 50) + 10 // Mock data for chart
      };
    });

    // Mock FSRS retention projection (Forgetting Curve)
    const retentionData = Array.from({length: 10}).map((_, i) => {
      return {
        days: i,
        // Ebbinghaus / FSRS style retention decay curve
        retention: Math.round(100 * Math.exp(-i / (averageStability > 0 ? averageStability : 2)))
      };
    });

    return {
       totalXp: user.totalXp,
       currentStreak: user.currentStreak,
       totalNodesCompleted: nodes.length,
       totalReviews,
       averageStability: averageStability.toFixed(2),
       upcomingReviews,
       xpHistory,
       retentionData,
       stabilityDistribution: stabilityData
    };
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async updateXp(id: string, amount: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        totalXp: {
          increment: amount,
        },
      },
    });
  }
}
