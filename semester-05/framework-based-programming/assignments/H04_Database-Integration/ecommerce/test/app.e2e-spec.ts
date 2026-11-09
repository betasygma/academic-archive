/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/typeorm/users/entities/user.entity';
import { Post } from '../src/typeorm/posts/entities/post.entity';
import { Like } from '../src/typeorm/likes/entities/like.entity';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App E2E Tests', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let likeRepository: Repository<Like>;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    postRepository = moduleFixture.get<Repository<Post>>(
      getRepositoryToken(Post),
    );
    likeRepository = moduleFixture.get<Repository<Like>>(
      getRepositoryToken(Like),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await likeRepository.clear();
    await postRepository.clear();
    await userRepository.clear();

    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('TypeORM CRUD', () => {
    describe('Users CRUD', () => {
      it('POST /typeorm/users - should create a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /typeorm/users - should return all users', () => {
        return request(app.getHttpServer())
          .get('/typeorm/users')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /typeorm/users/:id - should return a specific user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        return request(app.getHttpServer())
          .get(`/typeorm/users/${createdUserId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /typeorm/users/:id - should update a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        const updateUserDto = {
          name: 'Updated User',
        };

        return request(app.getHttpServer())
          .patch(`/typeorm/users/${createdUserId}`)
          .send(updateUserDto)
          .expect(200);
      });

      it('DELETE /typeorm/users/:id - should delete a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/typeorm/users/${createdUserId}`)
          .expect(200);
      });
    });

    describe('Posts CRUD', () => {
      it('POST /typeorm/posts - should create a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const response = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /typeorm/posts - should return all posts', () => {
        return request(app.getHttpServer())
          .get('/typeorm/posts')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /typeorm/posts/:id - should return a specific post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        return request(app.getHttpServer())
          .get(`/typeorm/posts/${createdPostId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /typeorm/posts/:id - should update a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        const updatePostDto = {
          title: 'Updated Post Title',
        };

        return request(app.getHttpServer())
          .patch(`/typeorm/posts/${createdPostId}`)
          .send(updatePostDto)
          .expect(200);
      });

      it('DELETE /typeorm/posts/:id - should delete a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/typeorm/posts/${createdPostId}`)
          .expect(200);
      });
    });

    describe('Likes CRUD', () => {
      it('POST /typeorm/likes - should create a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const response = await request(app.getHttpServer())
          .post('/typeorm/likes')
          .send(createLikeDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /typeorm/likes - should return all likes', () => {
        return request(app.getHttpServer())
          .get('/typeorm/likes')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /typeorm/likes/:id - should return a specific like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/typeorm/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        return request(app.getHttpServer())
          .get(`/typeorm/likes/${createdLikeId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /typeorm/likes/:id - should update a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/typeorm/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        // Create another user to update the like to
        const createAnotherUserDto = {
          name: 'Another User',
          email: 'another@example.com',
        };

        const anotherUserResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createAnotherUserDto)
          .expect(201);

        const updateLikeDto = {
          userId: anotherUserResponse.body.id,
        };

        await request(app.getHttpServer())
          .patch(`/typeorm/likes/${createdLikeId}`)
          .send(updateLikeDto)
          .expect(200);
      });

      it('DELETE /typeorm/likes/:id - should delete a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/typeorm/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/typeorm/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/typeorm/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/typeorm/likes/${createdLikeId}`)
          .expect(200);
      });
    });
  });

  describe('Prisma CRUD', () => {
    describe('Users CRUD', () => {
      it('POST /prisma/users - should create a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const response = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /prisma/users - should return all users', () => {
        return request(app.getHttpServer())
          .get('/prisma/users')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /prisma/users/:id - should return a specific user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        return request(app.getHttpServer())
          .get(`/prisma/users/${createdUserId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /prisma/users/:id - should update a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        const updateUserDto = {
          name: 'Updated User',
        };

        return request(app.getHttpServer())
          .patch(`/prisma/users/${createdUserId}`)
          .send(updateUserDto)
          .expect(200);
      });

      it('DELETE /prisma/users/:id - should delete a user', async () => {
        const createUserDto = {
          name: 'Test User',
          email: 'test@example.com',
        };

        const createResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserId = createResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/prisma/users/${createdUserId}`)
          .expect(200);
      });
    });

    describe('Posts CRUD', () => {
      it('POST /prisma/posts - should create a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const response = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /prisma/posts - should return all posts', () => {
        return request(app.getHttpServer())
          .get('/prisma/posts')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /prisma/posts/:id - should return a specific post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        return request(app.getHttpServer())
          .get(`/prisma/posts/${createdPostId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /prisma/posts/:id - should update a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        const updatePostDto = {
          title: 'Updated Post Title',
        };

        return request(app.getHttpServer())
          .patch(`/prisma/posts/${createdPostId}`)
          .send(updatePostDto)
          .expect(200);
      });

      it('DELETE /prisma/posts/:id - should delete a post', async () => {
        // First create a user to be the author
        const createUserDto = {
          name: 'Post Author',
          email: 'author@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForPost = userResponse.body.id;

        const createPostDto = {
          title: 'Test Post',
          content: 'This is a test post content',
          authorId: createdUserIdForPost,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostId = postResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/prisma/posts/${createdPostId}`)
          .expect(200);
      });
    });

    describe('Likes CRUD', () => {
      it('POST /prisma/likes - should create a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const response = await request(app.getHttpServer())
          .post('/prisma/likes')
          .send(createLikeDto)
          .expect(201);

        expect(response.body).toBeDefined();
      });

      it('GET /prisma/likes - should return all likes', () => {
        return request(app.getHttpServer())
          .get('/prisma/likes')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('GET /prisma/likes/:id - should return a specific like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/prisma/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        return request(app.getHttpServer())
          .get(`/prisma/likes/${createdLikeId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeDefined();
          });
      });

      it('PATCH /prisma/likes/:id - should update a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/prisma/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        // Create another user to update the like to
        const createAnotherUserDto = {
          name: 'Another User',
          email: 'another@example.com',
        };

        const anotherUserResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createAnotherUserDto)
          .expect(201);

        const updateLikeDto = {
          userId: anotherUserResponse.body.id,
        };

        await request(app.getHttpServer())
          .patch(`/prisma/likes/${createdLikeId}`)
          .send(updateLikeDto)
          .expect(200);
      });

      it('DELETE /prisma/likes/:id - should delete a like', async () => {
        // First create a user
        const createUserDto = {
          name: 'Like User',
          email: 'liker@example.com',
        };

        const userResponse = await request(app.getHttpServer())
          .post('/prisma/users')
          .send(createUserDto)
          .expect(201);

        const createdUserIdForLike = userResponse.body.id;

        // Then create a post
        const createPostDto = {
          title: 'Post to Like',
          content: 'This post will be liked',
          authorId: createdUserIdForLike,
        };

        const postResponse = await request(app.getHttpServer())
          .post('/prisma/posts')
          .send(createPostDto)
          .expect(201);

        const createdPostIdForLike = postResponse.body.id;

        // Now create the like
        const createLikeDto = {
          userId: createdUserIdForLike,
          postId: createdPostIdForLike,
        };

        const likeResponse = await request(app.getHttpServer())
          .post('/prisma/likes')
          .send(createLikeDto)
          .expect(201);

        const createdLikeId = likeResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/prisma/likes/${createdLikeId}`)
          .expect(200);
      });
    });
  });
});
