import { IsInt } from 'class-validator';

export class CreateLikeDto {
  @IsInt()
  userId!: number;

  @IsInt()
  postId!: number;
}
