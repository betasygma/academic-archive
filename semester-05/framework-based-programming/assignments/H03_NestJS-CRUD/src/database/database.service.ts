import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DatabaseService {
  users: User[] = [];
  nextId = 1;

  resetData(): void {
    this.users = [];
    this.nextId = 1;
  }
}