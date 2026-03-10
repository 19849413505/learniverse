import { Injectable, Inject } from '@nestjs/common';
import { User } from '@prisma/client';
import { IUserRepository, IUserRepositoryToken } from './repositories/user.repository.interface';

@Injectable()
export class UsersService {
  constructor(
    @Inject(IUserRepositoryToken) private readonly userRepository: IUserRepository
  ) {}

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
    return this.userRepository.createUser(email, name, id);
  }

  async getUserById(id: string): Promise<User> {
    return this.userRepository.getUserById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.getAllUsers();
  }

  async updateXp(id: string, amount: number): Promise<User> {
    return this.userRepository.updateXp(id, amount);
  }
}
