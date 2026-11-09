import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto) {
    try {
      return await this.prisma.post.create({ data: createPostDto });
    } catch (e) {
      return this.handleError(e);
    }
  }

  async findAll() {
    return this.prisma.post.findMany({
      include: {
        author: true,
        likes: true,
      },
    });
  }

  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        likes: true,
      },
    });
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    try {
      return await this.prisma.post.update({
        where: { id },
        data: updatePostDto,
      });
    } catch (e) {
      return this.handleError(e, id);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.post.delete({ where: { id } });
    } catch (e) {
      this.handleError(e, id);
    }
  }

  private handleError(e: unknown, id?: number): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025' && id !== undefined) {
        throw new NotFoundException(`Post ${id} not found`);
      }
      if (e.code === 'P2003') {
        throw new BadRequestException('Author does not exist');
      }
    }
    throw e;
  }
}
