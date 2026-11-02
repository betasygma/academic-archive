import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  create(dto: CreateUserDto): User {
    const now = new Date().toISOString();
    const user: User = {
      id: this.db.nextId++,
      name: dto.name,
      age: dto.age,
      isAdmin: dto.isAdmin ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.db.users.push(user);
    return user;
  }

  findAll(): User[] {
    return this.db.users;
  }

  findOne(id: number): User {
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException({ error: 'User not found' });
    return user;
  }

  update(id: number, dto: UpdateUserDto): User {
    const user = this.findOne(id);
    user.name = dto.name;
    user.age = dto.age;
    user.isAdmin = dto.isAdmin ?? false;
    user.updatedAt = new Date().toISOString();
    return user;
  }

  remove(id: number) {
    const user = this.findOne(id);
    this.db.users = this.db.users.filter((u) => u.id !== id);
    return { message: 'User deleted', user };
  }
}