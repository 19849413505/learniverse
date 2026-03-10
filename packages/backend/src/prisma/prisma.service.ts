import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _isConnected = false;

  public get isConnected(): boolean {
    return this._isConnected;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this._isConnected = true;
      this.logger.log('Successfully connected to database');
    } catch (e) {
      this._isConnected = false;
      this.logger.error('Failed to connect to database. Starting without DB connection to allow testing other features.', e);
      // We don't throw here to allow the server to start even if the local postgres isn't running
      // Note: any API call that hits the DB will fail, but AI logic will still be testable
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this._isConnected = false;
  }
}
