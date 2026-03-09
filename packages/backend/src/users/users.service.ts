import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, name?: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        name,
      },
    });
  }

  async getUserById(id: string): Promise<User> {
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
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async updateXp(id: string, amount: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        totalXp: {
          increment: amount,
        },
      },
    });
  }
}
