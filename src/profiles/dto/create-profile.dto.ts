import { IsArray, IsString } from 'class-validator';
import { Author } from 'src/authors/entities/author.entity';

export class CreateProfileDto {
  @IsString()
  nickname?: string;

  @IsString()
  bio?: string;

  @IsString()
  avatarUrl?: string;

  @IsArray()
  mostReadAuthors?: Author[];
}
