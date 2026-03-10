import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() body: { email: string; name?: string }) {
    return this.usersService.createUser(body.email, body.name);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get(':id/analytics')
  async getUserAnalytics(@Param('id') id: string) {
     return this.usersService.getUserAnalytics(id);
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post(':id/xp')
  async addXP(@Param('id') id: string, @Body() body: { amount: number }) {
    // For MVP, if the user doesn't exist, create it (auto-provisioning)
    try {
      await this.usersService.getUserById(id);
    } catch {
      await this.usersService.createUser(`user-${id}@demo.com`, `Demo User`, id);
    }
    return this.usersService.updateXp(id, body.amount);
  }
}
