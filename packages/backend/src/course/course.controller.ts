import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import { CourseService } from './course.service';
import { Response } from 'express';
import { AiService } from '../ai/ai.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Course & Skill Tree')
@Controller('course')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly aiService: AiService
  ) {}

  @Post('generate-tree')
  async generateCourseTree(
    @Body() body: { text: string; deckId: string; isDeepResearch?: boolean; customConfig?: any }
  ) {
    if (!body.text || !body.deckId) {
      return { error: 'text and deckId are required' };
    }

    // Trigger async processing in the background. Return immediately.
    // In a real production system, use BullMQ/Redis here. For MVP, we use fire-and-forget.
    this.courseService.processCourseGenerationAsync(
       body.deckId,
       body.text,
       body.isDeepResearch,
       body.customConfig,
       this.aiService
    ).catch(e => console.error('Background generation failed', e));

    return {
      message: 'Course Skill Tree generation started.',
      deckId: body.deckId
    };
  }

  @Get('generate-tree/stream/:deckId')
  streamGenerationProgress(@Param('deckId') deckId: string, @Res() res: Response) {
    // Note: We need to import @Res() from @nestjs/common and Response from express
    return this.courseService.subscribeToProgress(deckId, res as any);
  }

  @Get('skill-tree/:userId/:deckId')
  async getSkillTree(
    @Param('userId') userId: string,
    @Param('deckId') deckId: string
  ) {
    const nodes = await this.courseService.getUserSkillTree(userId, deckId);
    return { nodes };
  }

  @Post('complete-node/:userId/:nodeId')
  async completeNode(
     @Param('userId') userId: string,
     @Param('nodeId') nodeId: string
  ) {
     return this.courseService.completeNode(userId, nodeId);
  }

  @Get('diagnostic/:deckId')
  async getDiagnostic(@Param('deckId') deckId: string) {
     const questions = await this.courseService.generateDiagnosticTest(deckId);
     return { questions };
  }

  @Post('diagnostic/submit/:userId/:deckId')
  async submitDiagnostic(
     @Param('userId') userId: string,
     @Param('deckId') deckId: string,
     @Body() body: { passedNodeIds: string[] }
  ) {
     return this.courseService.submitDiagnosticResults(userId, deckId, body.passedNodeIds || []);
  }
}
