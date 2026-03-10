import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Determine the database URL dynamically
    // In an Electron / packaged environment, we might want to override the database URL
    // to point to a local SQLite file (or ensure the PostgreSQL instance is correctly pointed)
    // For Option B (Perfect Desktop Encapsulation), a fallback or environment check is crucial.
    const isDesktop = process.env.IS_ELECTRON === 'true' || process.env.DESKTOP_ENV === 'true';
    let databaseUrl = process.env.DATABASE_URL;

    // Optional: Switch to SQLite if in desktop mode and standard DB is missing
    // Currently, Prisma schema relies on Postgres, so we just log the config.
    // If we wanted to actually fall back to SQLite, the Prisma schema would need multiple provider support or a separate SQLite schema.
    if (isDesktop) {
        console.log(`[Desktop Mode] Initializing Prisma with configured database path...`);
        if (!databaseUrl) {
            console.warn(`[Desktop Mode] No DATABASE_URL provided. Please ensure the local DB process is running.`);
        }
    }

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to the database.');
    } catch (error) {
      console.error('Failed to connect to the database. Ensure the database service is running.', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
