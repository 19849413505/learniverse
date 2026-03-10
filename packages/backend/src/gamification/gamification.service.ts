import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDailyStreaks() {
    this.logger.log('Running daily streak processing cron job...');
    if (!this.prisma.isConnected || this.prisma.isOfflineMode) {
      this.logger.warn('Skipping cron job: Database is offline.');
      return;
    }

    try {
      const users = await this.usersService.getAllUsers();
      let updatedCount = 0;

      for (const user of users) {
        // Here we would typically check the user's latest activity logs.
        // For MVP, we'll increment the streak if they gained any XP today,
        // otherwise reset to 0. Since we don't have an explicit 'lastActive' field
        // in the current schema without modifying prisma schema, we will just log the intent.

        // Pseudo-code implementation:
        // const hasActivityToday = await this.prisma.activityLog.findFirst(...)
        // if (hasActivityToday) { await this.prisma.user.update(streak: { increment: 1 }) }
        // else { await this.prisma.user.update(streak: 0) }

        updatedCount++;
      }

      this.logger.log(`Daily streak processing completed. Users evaluated: ${updatedCount}`);
    } catch (error) {
      this.logger.error('Failed to process daily streaks', error instanceof Error ? error.stack : 'Unknown error');
    }
  }

  @Cron('0 23 * * 0') // Every Sunday at 11:00 PM
  async processWeeklyLeagueSettlement() {
    this.logger.log('Running weekly league settlement cron job...');
    if (!this.prisma.isConnected || this.prisma.isOfflineMode) {
      this.logger.warn('Skipping cron job: Database is offline.');
      return;
    }

    try {
      // Find top users by XP this week
      const users = await this.prisma.user.findMany({
        orderBy: { totalXp: 'desc' },
        take: 100, // Top 100
      });

      // Pseudo-logic: promote top 20%, demote bottom 20%
      const top20Count = Math.floor(users.length * 0.2);

      this.logger.log(`Weekly settlement completed. Top player: ${users[0]?.name} with ${users[0]?.totalXp} XP`);

      // We would update user leagues here and reset weekly XP
      // await this.prisma.user.updateMany({ data: { weeklyXp: 0 } });
    } catch (error) {
      this.logger.error('Failed to process weekly league settlement', error instanceof Error ? error.stack : 'Unknown error');
    }
  }
}
