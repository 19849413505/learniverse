import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { CourseModule } from './course/course.module';
import { AffinityModule } from './affinity/affinity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    UsersModule,
    CardsModule,
    CourseModule,
    AffinityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
