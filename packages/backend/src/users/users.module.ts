import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { IUserRepositoryToken } from './repositories/user.repository.interface';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { MockUserRepository } from './repositories/mock-user.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: IUserRepositoryToken,
      useFactory: (prismaService: PrismaService) => {
        // Decide which repository to inject based on the connection/offline status
        // Alternatively, this could strictly check configService.get('OFFLINE_MODE')
        if (prismaService.isOfflineMode) {
          return new MockUserRepository();
        }
        return new PrismaUserRepository(prismaService);
      },
      inject: [PrismaService],
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
