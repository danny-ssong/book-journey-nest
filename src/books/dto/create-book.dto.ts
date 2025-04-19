import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

export class CreateBookDto {
  @IsString()
  isbn: string;

  @IsString()
  title: string;

  @IsString()
  contents: string;

  @IsString()
  url: string;

  @IsString()
  publisher: string;

  @IsString()
  author: string;

  @IsString()
  thumbnailUrl: string;

  @IsDate()
  @Type(() => Date)
  publishedAt: Date;
}
