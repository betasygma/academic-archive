import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required and must be a non-empty string' })
  @MaxLength(100, { message: 'Name must be 100 characters or less' })
  name: string;

  @IsInt({ message: 'Age must be a number' })
  @Min(0, { message: 'Age must be between 0 and 150' })
  @Max(150, { message: 'Age must be between 0 and 150' })
  age: number;

  @IsOptional()
  @IsBoolean({ message: 'isAdmin must be a boolean value' })
  isAdmin?: boolean;
}