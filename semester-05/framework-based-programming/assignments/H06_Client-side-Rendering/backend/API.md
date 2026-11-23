# NestJS Posts API Backend

This is the API backend for the NextJS posts applications in the 006 directory.

## Features

- RESTful API for posts management
- Support for nested replies
- CORS enabled for NextJS frontends
- Prisma ORM with SQLite database
- Data validation with class-validator

## API Endpoints

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/posts` | Get all posts with replies |
| POST   | `/posts` | Create a new post |
| GET    | `/posts/:id` | Get a specific post |
| PUT    | `/posts/:id` | Update a post |
| DELETE | `/posts/:id` | Delete a post |
| GET    | `/posts/:id/replies` | Get replies for a post |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/` | API status |
| GET    | `/health` | Health check |

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Start the development server:
   ```bash
   pnpm run start:dev
   ```

The API will be available at `http://localhost:3000`

## Post Schema

```typescript
interface Post {
  id: string;
  posterName: string;
  content: string;
  replyToId?: string;  // null for top-level posts
  createdAt: string;
  updatedAt: string;
  replies: Post[];     // nested replies
}
```

## Creating Posts

### New Post
```json
POST /posts
{
  "posterName": "John Doe",
  "content": "This is a new post"
}
```

### Reply to Post
```json
POST /posts
{
  "posterName": "Jane Smith",
  "content": "This is a reply",
  "replyToId": "post-uuid-here"
}
```

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3001` (NextJS live app)
- `http://localhost:3002` (NextJS E05 app)