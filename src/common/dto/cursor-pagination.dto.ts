import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '페이지네이션 커서(base64 인코딩)',
    example:
      'eyJ2YWx1ZXMiOnsic3RhcnREYXRlIjoiMjAyNS0wMy0wOFQwMDowMDowMC4wMDBaIn0sIm9yZGVyIjpbInN0YXJ0RGF0ZV9ERVNDIl19',
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: '정렬 기준 $속성_DESC or $속성_ASC Array',
    example: ['id_DESC'],
  })
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 개수',
    example: 5,
  })
  take: number = 5;
}
