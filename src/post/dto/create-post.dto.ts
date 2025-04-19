import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBookDto } from 'src/books/dto/create-book.dto';
// book을 직접 하나하나 table에 넣어서 관리할게 아니라, kakao api를 통해 book을 검색하고
// post로 작성된 book들만 table에 넣어서 관리할 것이기 때문에
// post를 생성할 때 book도 생성한다.

export class CreatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsInt()
  @Min(0)
  @Max(5)
  rating: number;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsBoolean()
  isPrivate: boolean;

  @ValidateNested()
  @Type(() => CreateBookDto)
  book: CreateBookDto;
}
