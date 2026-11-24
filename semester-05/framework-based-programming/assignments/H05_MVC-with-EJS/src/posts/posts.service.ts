import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.post.findMany({
      where: { replyToId: null },
      include: { 
        replies: {
          orderBy: { createdAt: 'desc' },
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        replies: {
          include: { replies: true },
          orderBy: { createdAt: 'desc' },
        }
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(createPostDto: CreatePostDto) {
    if (createPostDto.replyToId) {
      await this.findOne(createPostDto.replyToId);
    }

    return this.prisma.post.create({
      data: createPostDto,
    });
  }

  update(id: string, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const idsToDelete = [id];
    for (let i = 0; i < idsToDelete.length; i++) {
      const replies = await this.prisma.post.findMany({
        where: { replyToId: idsToDelete[i] },
        select: { id: true },
      });
      idsToDelete.push(...replies.map(reply => reply.id));
    }

    await this.prisma.post.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    return { message: `Post with ID ${id} and its replies deleted successfully` };
  }
}
