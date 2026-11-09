import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
