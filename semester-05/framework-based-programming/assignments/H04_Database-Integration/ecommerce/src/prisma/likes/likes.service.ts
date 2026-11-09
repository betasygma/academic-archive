import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLikeDto: CreateLikeDto) {
    try {
      return await this.prisma.like.create({ data: createLikeDto });
    } catch (e) {
      return this.handleError(e);
    }
  }

  async findAll() {
    return this.prisma.like.findMany({
      include: {
        user: true,
        post: true,
      },
    });
  }

  async findOne(id: number) {
    const like = await this.prisma.like.findUnique({
      where: { id },
      include: {
        user: true,
        post: true,
      },
    });
    if (!like) throw new NotFoundException(`Like ${id} not found`);
    return like;
  }

  async update(id: number, updateLikeDto: UpdateLikeDto) {
    try {
      return await this.prisma.like.update({
        where: { id },
        data: updateLikeDto,
      });
    } catch (e) {
      return this.handleError(e, id);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.like.delete({ where: { id } });
    } catch (e) {
      this.handleError(e, id);
    }
  }

  private handleError(e: unknown, id?: number): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025' && id !== undefined) {
        throw new NotFoundException(`Like ${id} not found`);
      }
      if (e.code === 'P2002') {
        throw new ConflictException('Post already liked by this user');
      }
    }
    throw e;
  }
}
