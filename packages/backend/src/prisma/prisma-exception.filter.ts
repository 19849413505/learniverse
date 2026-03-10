import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(`Database error caught by Global Filter: ${exception.message}`, exception.stack);

    // Provide a graceful degradation JSON response instead of bringing down the application or returning 500 html
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Database Unavailable',
      message: 'The system is currently unable to reach the database. Some features may be restricted. Please try again later.',
      offlineMode: true,
      timestamp: new Date().toISOString(),
    });
  }
}
