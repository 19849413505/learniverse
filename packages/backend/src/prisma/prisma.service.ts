import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _isConnected = false;
  private reconnectInterval: any;

  constructor(private configService: ConfigService) {
    super();
  }
  public get isConnected(): boolean {
    return this._isConnected;
  }
  public get isOfflineMode(): boolean {
    return this.configService.get<string>('OFFLINE_MODE') === 'true';
  }
  async onModuleInit() {
    if (this.isOfflineMode) {
      this.logger.warn('OFFLINE_MODE is enabled. Starting in Mock DB mode without connection.');
      this._isConnected = false;
      return;
    }

    try {
      await this.$connect();
      this._isConnected = true;
      this.logger.log('Successfully connected to Postgres database');
    } catch (e) {
      this._isConnected = false;
      this.logger.error('Failed to connect to database. Starting without DB connection. Will retry in background...', e);
      this.startReconnectLoop();
    }
  }

  private startReconnectLoop() {
    if (this.reconnectInterval) return;

    // Retry connection every 10 seconds
    this.reconnectInterval = setInterval(async () => {
      this.logger.debug('Attempting to reconnect to Postgres database...');
      try {
        await this.$connect();
        this._isConnected = true;
        this.logger.log('Successfully reconnected to database!');
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      } catch (error) {
        // Still failing, log quietly and retry on next tick
        this.logger.debug('Database reconnect attempt failed.');
      }
    }, 10000);
  }

  async onModuleDestroy() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    await this.$disconnect();
    this._isConnected = false;
  }
}
