import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Knowledge & AI')
@Controller('api')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('knowledge/graph')
  async generateGraph(@Body() body: { text: string; customConfig?: any }) {
    if (!body.text) {
      return { error: 'Text content is required' };
    }
    return this.aiService.generateKnowledgeGraph(body.text, body.customConfig);
  }

  @Post('knowledge/cards')
  async generateCards(@Body() body: { nodeName: string; nodeContext?: string; customConfig?: any }) {
    if (!body.nodeName) {
      return { error: 'nodeName is required' };
    }
    const cards = await this.aiService.generateFlashcards(
      body.nodeName,
      body.nodeContext || '',
      body.customConfig,
    );
    return { cards };
  }

  @Post('archimedes/chat')
  async chatTutor(
    @Body() body: { message: string; history?: any[]; context?: string; customConfig?: any },
  ) {
    if (!body.message) {
      return { error: 'message is required' };
    }
    const reply = await this.aiService.socraticTutor(
      body.message,
      body.history || [],
      body.context || '',
      body.customConfig,
    );
    return { reply };
  }
}
