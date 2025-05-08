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
import { OptionalJwtAuthGuard } from 'src/auth/strategy/optional-jwt.strategy';

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(TransactionInterceptor)
  create(
    @UserId() userId: string,
    @Body() createPostDto: CreatePostDto,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.postService.create(userId, createPostDto, queryRunner);
  }

  @Get()
  findAll(@Query() getPostsDto: GetPostsDto) {
    return this.postService.findAll(getPostsDto);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  findMyPosts(@UserId() userId: string, @Query() getPostsDto: GetPostsDto) {
    return this.postService.findPostsByUser(userId, getPostsDto, true);
  }

  @Get('user/:userId')
  findUserPosts(
    @Query() getPostsDto: GetPostsDto,
    @Param('userId') userId: string,
  ) {
    return this.postService.findPostsByUser(userId, getPostsDto, false);
  }

  @Get('book/:isbn')
  findBookPosts(@Param('isbn') isbn: string) {
    return this.postService.findPostsByBook(isbn);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@UserId() userId: string, @Param('id', ParseIntPipe) id: number) {
    return this.postService.findPostById(userId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postService.remove(id);
  }
}
