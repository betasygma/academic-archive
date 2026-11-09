import { Module } from '@nestjs/common';
import { LikesModule } from './likes/likes.module';
import { PostsModule } from './posts/posts.module';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, PostsModule, LikesModule],
  providers: [PrismaService],
  exports: [PrismaService, UsersModule, PostsModule, LikesModule],
})
export class PrismaModule {}
