import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.post.findMany({
      include: { replies: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(createPostDto: CreatePostDto) {
    const { posterName, content, replyToId } = createPostDto;

    if (replyToId) {
      await this.findOne(replyToId);
    }

    return this.prisma.post.create({
      data: {
        posterName,
        content,
        ...(replyToId ? { replyToId } : {}),
      },
      include: { replies: true },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { replies: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return post;
  }

  async findReplies(id: string) {
    await this.findOne(id);

    return this.prisma.post.findMany({
      where: { replyToId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.findOne(id);

    if (updatePostDto.replyToId) {
      await this.findOne(updatePostDto.replyToId);
    }

    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: { replies: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.post.delete({
      where: { id },
      include: { replies: true },
    });
  }
}
