import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Book } from 'src/books/entities/book.entity';
import { User } from 'src/users/entities/user.entity';
import { Author } from 'src/authors/entities/author.entity';
import { CommonModule } from 'src/common/common.module';
import { BooksModule } from 'src/books/books.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Book, User, Author]),
    CommonModule,
    BooksModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
