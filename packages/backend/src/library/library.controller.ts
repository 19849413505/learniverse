import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, Param, Sse } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LibraryService } from './library.service';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import * as crypto from 'crypto';

@Controller('library')
export class LibraryController {
  // A simple memory-based job queue & SSE bus
  private jobs: Map<string, { status: string, progress: number, text?: string }> = new Map();
  private sseClients: Map<string, Subject<any>> = new Map();

  constructor(private readonly libraryService: LibraryService) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async extractText(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Generate a unique taskId
    const taskId = crypto.randomBytes(8).toString('hex');
    this.jobs.set(taskId, { status: 'processing', progress: 0 });

    // Process asynchronously without blocking the HTTP response
    this.processFileAsync(taskId, file);

    // Return the taskId immediately
    return { taskId, fileName: file.originalname, status: 'processing' };
  }

  private async processFileAsync(taskId: string, file: Express.Multer.File) {
    try {
      this.broadcastToTask(taskId, { type: 'progress', progress: 10, message: 'Starting extraction...' });

      // We pass the actual parsing logic. (Assuming libraryService is CPU heavy, in production
      // we might want a real worker thread here. For MVP, we use the standard event loop).
      this.broadcastToTask(taskId, { type: 'progress', progress: 50, message: 'Processing text...' });
      const text = await this.libraryService.extractTextFromFile(file);

      this.jobs.set(taskId, { status: 'completed', progress: 100, text });
      this.broadcastToTask(taskId, { type: 'complete', progress: 100, text });

      // Cleanup after 5 minutes
      setTimeout(() => {
        this.jobs.delete(taskId);
        if (this.sseClients.has(taskId)) {
          this.sseClients.get(taskId)?.complete();
          this.sseClients.delete(taskId);
        }
      }, 5 * 60 * 1000);

    } catch (e) {
      this.jobs.set(taskId, { status: 'failed', progress: 0 });
      this.broadcastToTask(taskId, { type: 'error', message: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  private broadcastToTask(taskId: string, data: any) {
    const subject = this.sseClients.get(taskId);
    if (subject) {
      subject.next({ data });
    }
  }

  @Sse('extract/stream/:taskId')
  streamExtractionProgress(@Param('taskId') taskId: string): Observable<MessageEvent> {
    let subject = this.sseClients.get(taskId);
    if (!subject) {
      subject = new Subject<any>();
      this.sseClients.set(taskId, subject);
    }

    // If already completed before they connected, send the result immediately on next tick
    const job = this.jobs.get(taskId);
    if (job?.status === 'completed') {
       setTimeout(() => {
          subject.next({ data: { type: 'complete', progress: 100, text: job.text } });
       }, 100);
    } else if (job?.status === 'failed') {
       setTimeout(() => {
          subject.next({ data: { type: 'error', message: 'Task failed' } });
       }, 100);
    }

    // Map next.js/nestjs SSE format
    return subject.asObservable().pipe(
      map((payload: any) => payload as MessageEvent),
    );
  }
}
