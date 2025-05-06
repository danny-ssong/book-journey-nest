import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { SearchBookDto } from './dto/search-book.dto';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('books')
@UseInterceptors(ClassSerializerInterceptor)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  searchBooks(@Query() searchBookDto: SearchBookDto) {
    return this.booksService.searchBooks(searchBookDto);
  }

  @Get(':isbn')
  findOne(@Param('isbn') isbn: string) {
    return this.booksService.findOne(isbn);
  }

  @Get()
  findAll() {
    return this.booksService.findAll();
  }
}
