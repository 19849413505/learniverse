import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { CourseModule } from './course/course.module';
import { LibraryModule } from './library/library.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { GamificationModule } from './gamification/gamification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000, // 1 hour
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AiModule,
    UsersModule,
    CardsModule,
    CourseModule,
    LibraryModule,
    GamificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
