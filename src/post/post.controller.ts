import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/strategy/jwt.strategy';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { GetPostsDto } from './dto/get-posts.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { User } from 'src/users/entities/user.entity';
import { UserId } from 'src/common/decorator/user-id.decorator';
import { BooksService } from 'src/books/books.service';

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly booksService: BooksService,
  ) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(
    @UserId() userId: string,
    @Body() createPostDto: CreatePostDto,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.postService.create(userId, createPostDto, queryRunner);
  }

  @Get()
  @Public()
  findAll(@Query() getPostsDto: GetPostsDto) {
    return this.postService.findAll(getPostsDto);
  }

  @Get('user/me')
  findMyPosts(@UserId() userId: string, @Query() getPostsDto: GetPostsDto) {
    return this.postService.findPostsByUser(userId, getPostsDto, true);
  }

  @Get('user/:userId')
  @Public()
  findUserPosts(
    @Query() getPostsDto: GetPostsDto,
    @Param('userId') userId: string,
  ) {
    return this.postService.findPostsByUser(userId, getPostsDto, false);
  }

  @Get('book/:isbn')
  @Public()
  async findBookWithPosts(@Param('isbn') isbn: string) {
    const bookWithPosts = await this.postService.findPostsByBook(isbn);
    if (bookWithPosts) return bookWithPosts;

    // 포스트를 생성할 때 책도 db에 추가함. 포스트가 등록되지 않은 책은 Kakao API를 통해 책 정보를 조회해서 반환
    const bookFromApi = await this.booksService.findOne(isbn);
    return {
      ...bookFromApi,
      posts: [],
    };
  }

  @Get(':id')
  @Public()
  findOne(@UserId() userId: string, @Param('id', ParseIntPipe) id: number) {
    return this.postService.findPostById(userId, id);
  }

  @Put(':id')
  @UseInterceptors(TransactionInterceptor)
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: string,
    @Body() updatePostDto: UpdatePostDto,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.postService.update(id, userId, updatePostDto, queryRunner);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(id);
  }
}
