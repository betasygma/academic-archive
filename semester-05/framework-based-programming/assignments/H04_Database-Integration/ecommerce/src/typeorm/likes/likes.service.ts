import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { Like } from './entities/like.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
  ) {}

  async create(createLikeDto: CreateLikeDto): Promise<Like> {
    const exists = await this.likeRepository.findOneBy({
      userId: createLikeDto.userId,
      postId: createLikeDto.postId,
    });
    if (exists) throw new ConflictException('Post already liked by this user');
    return this.likeRepository.save(this.likeRepository.create(createLikeDto));
  }

  async findAll(): Promise<Like[]> {
    return this.likeRepository.find({ relations: { 
      user: true,
      post: true 
    } });
  }

  async findOne(id: number): Promise<Like> {
    const like = await this.likeRepository.findOne({
      where: { id },
      relations: { 
        user: true,
        post: true 
      },
    });
    if (!like) throw new NotFoundException(`Like ${id} not found`);
    return like;
  }

  async update(id: number, updateLikeDto: UpdateLikeDto): Promise<Like> {
    const like = await this.likeRepository.findOneBy({ id }); // tanpa relasi, sengaja
    if (!like) throw new NotFoundException(`Like ${id} not found`);
    Object.assign(like, updateLikeDto);
    return this.likeRepository.save(like);
  }

  async remove(id: number): Promise<void> {
    const like = await this.likeRepository.findOneBy({ id });
    if (!like) throw new NotFoundException(`Like ${id} not found`);
    await this.likeRepository.remove(like);
  }
}
