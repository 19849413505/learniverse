import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AffinityService } from './affinity.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Socrates-7 Affinity')
@Controller('affinity')
export class AffinityController {
  constructor(private readonly affinityService: AffinityService) {}

  @Post('session-end/:userId')
  async sessionEnd(
    @Param('userId') userId: string,
    @Body() body: { personaId: string; context: string; performance: 'excellent' | 'struggled' | 'lazy'; customConfig?: any }
  ) {
    return this.affinityService.evaluateSessionAndWriteDiary(
      userId,
      body.personaId || 'Socrates',
      body.context,
      body.performance || 'excellent',
      body.customConfig
    );
  }

  @Get('status/:userId')
  async getStatus(@Param('userId') userId: string) {
    return this.affinityService.getTutorStatus(userId);
  }
}
