import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private getMockUser(id: string = 'demo-user-id', email: string = 'demo@example.com', name: string = 'Demo User'): any {
    return {
      id,
      email,
      name,
      totalXp: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
      cardReviews: [], // mock empty learning progress
    };
  }

  async createUser(email: string, name?: string, id?: string): Promise<User> {
    if (!this.prisma.isConnected) {
      return this.getMockUser(id || 'mock-id', email, name || 'Mock User') as User;
    }
    try {
      return await this.prisma.user.create({
        data: {
          id, // if provided, use it (e.g. 'demo-user-id'), otherwise prisma defaults to uuid()
          email,
          name,
        },
      });
    } catch (error) {
      return this.getMockUser(id || 'mock-id', email, name || 'Mock User') as User;
    }
  }

  async getUserById(id: string): Promise<User> {
    if (!this.prisma.isConnected) {
      return this.getMockUser(id) as User;
    }
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          cardReviews: true, // Includes their learning progress
        },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      // fallback for any other database error
      return this.getMockUser(id) as User;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.prisma.isConnected) {
      return [this.getMockUser()] as User[];
    }
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      return [this.getMockUser()] as User[];
    }
  }

  async updateXp(id: string, amount: number): Promise<User> {
    if (!this.prisma.isConnected) {
      const mockUser = this.getMockUser(id);
      mockUser.totalXp += amount;
      return mockUser as User;
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          totalXp: {
            increment: amount,
          },
        },
      });
    } catch (error) {
      const mockUser = this.getMockUser(id);
      mockUser.totalXp += amount;
      return mockUser as User;
    }
  }
}
