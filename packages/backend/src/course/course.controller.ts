import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CourseService } from './course.service';
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
    @Body() body: { text: string; deckId: string; customConfig?: any; tutorPrompt?: string }
  ) {
    if (!body.text || !body.deckId) {
      return { error: 'text and deckId are required' };
    }

    // 1. Generate structured graph with MicroLessons via AI
    const graphOutput = await this.aiService.getCourseBuilderAgent(body.customConfig).process({
      text: body.text,
      tutorPrompt: body.tutorPrompt
    });

    // 2. Save the structure to PostgreSQL
    const result = await this.courseService.saveCourseGraph(body.deckId, graphOutput);

    return {
      message: 'Course Skill Tree Generated Successfully',
      ...result
    };
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
