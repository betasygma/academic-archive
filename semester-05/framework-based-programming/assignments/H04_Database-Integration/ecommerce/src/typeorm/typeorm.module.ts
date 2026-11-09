import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './likes/entities/like.entity';
import { LikesModule } from './likes/likes.module';
import { Post } from './posts/entities/post.entity';
import { PostsModule } from './posts/posts.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'ecommerce.sqlite',
      entities: [User, Post, Like],
      synchronize: true,
      // logging: true,
    }),
    UsersModule,
    PostsModule,
    LikesModule,
  ],
  exports: [UsersModule, PostsModule, LikesModule],
})
export class TypeormModule {}
