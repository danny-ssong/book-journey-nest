import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';

export class GetPostsDto extends CursorPaginationDto {
  order: string[] = ['startDate_DESC', 'id_DESC'];
}
