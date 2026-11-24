import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { handlePrismaError } from '../common/prisma-error.handler';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  private async execute<T>(
    operation: string,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      handlePrismaError(error, operation);
    }
  }

  @Get()
  @Render('index')
  async index() {
    return {
      posts: await this.execute('list posts', () =>
        this.postsService.findAll(),
      ),
    };
  }

  @Get('new')
  @Render('new')
  newPost() {
    return {};
  }

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @Res() response: Response,
  ) {
    const post = await this.execute('create post', () =>
      this.postsService.create(createPostDto),
    );

    return response.redirect(
      post.replyToId ? `/posts/${post.replyToId}` : `/posts/${post.id}`,
    );
  }

  @Get(':id/reply')
  @Render('reply')
  async replyForm(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Get(':id/edit')
  @Render('edit')
  async editForm(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Get(':id')
  @Render('show')
  async show(@Param('id') id: string) {
    return {
      post: await this.execute('find post', () =>
        this.postsService.findOne(id),
      ),
    };
  }

  @Post(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() response: Response,
  ) {
    await this.execute('update post', () =>
      this.postsService.update(id, updatePostDto),
    );

    return response.redirect(`/posts/${id}`);
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() response: Response) {
    await this.execute('delete post', () => this.postsService.remove(id));
    return response.redirect('/posts');
  }
}
