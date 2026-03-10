import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class MockUserRepository implements IUserRepository {
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
    return this.getMockUser(id || 'mock-id', email, name || 'Mock User') as User;
  }

  async getUserById(id: string): Promise<User> {
    return this.getMockUser(id) as User;
  }

  async getAllUsers(): Promise<User[]> {
    return [this.getMockUser()] as User[];
  }

  async updateXp(id: string, amount: number): Promise<User> {
    const mockUser = this.getMockUser(id);
    mockUser.totalXp += amount;
    return mockUser as User;
  }
}
