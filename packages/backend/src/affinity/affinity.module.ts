import { Module } from '@nestjs/common';
import { AffinityController } from './affinity.controller';
import { AffinityService } from './affinity.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [AffinityController],
  providers: [AffinityService],
  exports: [AffinityService],
})
export class AffinityModule {}
