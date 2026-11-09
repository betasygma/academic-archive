import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({ data: createUserDto });
    } catch (e) {
      return this.handleError(e);
    }
  }

  async findAll() {
    return this.prisma.user.findMany({ include: { posts: true } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { posts: true },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (e) {
      return this.handleError(e, id);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      this.handleError(e, id);
    }
  }

  private handleError(e: unknown, id?: number): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025' && id !== undefined) {
        throw new NotFoundException(`User ${id} not found`);
      }
      if (e.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
    }
    throw e;
  }
}
