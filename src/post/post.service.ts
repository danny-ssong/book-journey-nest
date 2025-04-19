import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { QueryRunner, Repository, UpdateResult } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Book } from 'src/books/entities/book.entity';
import { CreateBookDto } from 'src/books/dto/create-book.dto';
import { Author } from 'src/authors/entities/author.entity';
import { CreateAuthorDto } from 'src/authors/dto/create-author.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    private readonly commonService: CommonService,
  ) {}

  async create(userId: number, createPostDto: CreatePostDto, qr: QueryRunner) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const author = await this.authorRepository.findOne({
      where: { name: createPostDto.book.author },
    });

    let authorId: number;
    if (!author) {
      const authorResult = await this.createAuthor(
        { name: createPostDto.book.author },
        qr,
      );
      authorId = authorResult.identifiers[0].id as number;
    } else {
      authorId = author.id;
    }

    const book = await this.bookRepository.findOne({
      where: { isbn: createPostDto.book.isbn },
    });
    let bookId: string;
    if (!book) {
      const bookResult = await this.createBook(
        createPostDto.book,
        authorId,
        qr,
      );
      bookId = bookResult.identifiers[0].isbn as string;
    } else {
      bookId = book.isbn;
    }

    if (!bookId)
      throw new NotFoundException('Book not found and fail to create');
    const post = await this.createPost(createPostDto, userId, bookId, qr);
    const postId = post.identifiers[0].id as number;

    const newPost = await qr.manager
      .createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.book', 'book')
      .leftJoin('post.user', 'user')
      .addSelect('user.id')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('book.author', 'author')
      .where('post.id = :id', { id: postId })
      .getOne();

    return newPost;
  }

  private async createAuthor(author: CreateAuthorDto, qr: QueryRunner) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Author)
      .values(author)
      .execute();
  }

  private async createBook(
    book: CreateBookDto,
    authorId: number,
    qr: QueryRunner,
  ) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Book)
      .values({
        ...book,
        author: { id: authorId },
      })
      .execute();
  }

  private async updatePost(
    post: UpdatePostDto,
    id: number,
    userId: number,
    bookId: string,
    qr: QueryRunner,
  ) {
    return qr.manager.update(Post, id, {
      ...post,
      book: { isbn: bookId },
      user: { id: userId },
    });
  }

  private async createPost(
    post: CreatePostDto,
    userId: number,
    bookId: string,
    qr: QueryRunner,
  ) {
    return qr.manager
      .createQueryBuilder()
      .insert()
      .into(Post)
      .values({
        ...post,
        book: { isbn: bookId },
        user: { id: userId },
      })
      .execute();
  }

  async findUserPosts(userId: number, getPostsDto: GetPostsDto) {
    const qb = this.getUserPosts(userId);

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, getPostsDto);

    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      nextCursor,
      count,
    };
  }

  async findUserOwnPosts(userId: number, getPostsDto: GetPostsDto) {
    const qb = this.getOwnPosts(userId);

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, getPostsDto);

    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      nextCursor,
      count,
    };
  }

  private getUserPosts(userId: number) {
    return this.getPosts()
      .where('post.user.id = :userId', { userId })
      .andWhere('post.isPrivate = false');
  }

  private getOwnPosts(userId: number) {
    return this.getPosts().where('post.user.id = :userId', { userId });
  }

  private getPosts() {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.book', 'book')
      .leftJoin('post.user', 'user')
      .addSelect('user.id')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('book.author', 'author');
  }

  async findAll(getPostsDto: GetPostsDto) {
    const qb = this.getPosts();
    qb.andWhere('post.isPrivate = :isPrivate', { isPrivate: false });

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, getPostsDto);

    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      nextCursor,
      count,
    };
  }

  async findOne(userId: number, id: number) {
    const post = await this.getPosts().where('post.id = :id', { id }).getOne();
    if (post?.isPrivate && post.user.id !== userId)
      throw new ForbiddenException();

    return post;
  }

  async update(
    id: number,
    userId: number,
    updatePostDto: UpdatePostDto,
    qr: QueryRunner,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const author = await this.authorRepository.findOne({
      where: { name: updatePostDto.book.author },
    });

    let authorId: number;
    if (!author) {
      const authorResult = await this.createAuthor(
        { name: updatePostDto.book.author },
        qr,
      );
      authorId = authorResult.identifiers[0].id as number;
    } else {
      authorId = author.id;
    }

    const book = await this.bookRepository.findOne({
      where: { isbn: updatePostDto.book.isbn },
    });
    let bookId: string;
    if (!book) {
      const bookResult = await this.createBook(
        updatePostDto.book,
        authorId,
        qr,
      );
      bookId = bookResult.identifiers[0].isbn as string;
    } else {
      bookId = book.isbn;
    }

    if (!bookId)
      throw new NotFoundException('Book not found and fail to create');

    await this.updatePost(updatePostDto, id, userId, bookId, qr);

    const updatedPost = await this.postRepository.findOne({
      where: { id },
      relations: ['book'],
    });

    return updatedPost;
  }

  async remove(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) throw new NotFoundException('존재하지 않는 postId 입니다.');

    await this.postRepository.softDelete(id);

    return { id };
  }
}
