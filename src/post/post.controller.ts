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

@Controller('posts')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(
    @UserId() userId: number,
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
  findMyPosts(@UserId() userId: number, @Query() getPostsDto: GetPostsDto) {
    return this.postService.findUserOwnPosts(userId, getPostsDto);
  }

  @Get('user/:userId')
  @Public()
  findUserPosts(
    @Query() getPostsDto: GetPostsDto,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.postService.findUserPosts(userId, getPostsDto);
  }

  @Get('book/:isbn')
  @Public()
  findBookPosts(@Param('isbn') isbn: string) {
    return this.postService.findBookPosts(isbn);
  }

  @Get(':id')
  @Public()
  findOne(@UserId() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.postService.findOne(userId, id);
  }

  @Put(':id')
  @UseInterceptors(TransactionInterceptor)
  update(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
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
