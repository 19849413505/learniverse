import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [GamificationService],
})
export class GamificationModule {}
