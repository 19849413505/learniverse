import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AffinityService {
  private readonly logger = new Logger(AffinityService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService
  ) {}

  /**
   * Called after a session (e.g., micro-lesson) to evaluate user and write diary.
   */
  async evaluateSessionAndWriteDiary(
    userId: string,
    personaId: string,
    context: string,
    performance: 'excellent' | 'struggled' | 'lazy',
    customConfig?: any
  ) {
    this.logger.log(`Evaluating session for ${userId} by ${personaId}`);

    // Generate Diary Content via AI
    const chatAgent = this.aiService.getChatAgent(customConfig);
    const systemPrompt = `You are ${personaId}. Your student just finished a lesson on: "${context}". Their performance was: ${performance}. Write a short, personal, emotional diary entry (under 100 words) about how you feel about their progress today. Don't address them directly, write it in your secret diary.`;

    let content = "The student did well today. I'm proud.";
    try {
      const response = await chatAgent.process({
        message: 'Write your diary entry.',
        history: [{ role: 'system', content: systemPrompt }],
        context: '',
        persona: { name: personaId, personality: 'Be emotional.' }
      });
      content = response.reply;
    } catch (e) {
      this.logger.warn('Mocking diary generation');
    }

    // Determine affinity change
    let scoreChange = 0;
    if (performance === 'excellent') scoreChange = 5;
    if (performance === 'lazy') scoreChange = -2;
    if (performance === 'struggled') scoreChange = 2; // Struggling but trying is good!

    // Save Diary
    const diary = await this.prisma.diaryEntry.create({
      data: {
        userId,
        personaId,
        content
      }
    });

    // Update Affinity
    const affinity = await this.prisma.tutorAffinity.upsert({
      where: { userId_personaId: { userId, personaId } },
      update: { score: { increment: scoreChange } },
      create: { userId, personaId, score: scoreChange }
    });

    return { diary, affinity };
  }

  async getTutorStatus(userId: string) {
    const affinities = await this.prisma.tutorAffinity.findMany({
      where: { userId }
    });

    const diaries = await this.prisma.diaryEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return { affinities, diaries };
  }
}
