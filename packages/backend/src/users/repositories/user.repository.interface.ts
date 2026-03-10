import { User } from '@prisma/client';

export interface IUserRepository {
  createUser(email: string, name?: string, id?: string): Promise<User>;
  getUserById(id: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateXp(id: string, amount: number): Promise<User>;
}

export const IUserRepositoryToken = Symbol('IUserRepository');
