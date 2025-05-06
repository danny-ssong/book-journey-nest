import { IsNumber, IsString, MinLength } from 'class-validator';

export class SearchBookDto {
  @IsString()
  @MinLength(2, { message: 'query 2글자 이상 입력해주세요' })
  query: string;

  @IsNumber()
  size: number = 10;

  @IsNumber()
  page: number = 1;
}
