import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { QueryRunner, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Book } from 'src/books/entities/book.entity';
import { CreateBookDto } from 'src/books/dto/create-book.dto';
import { Author } from 'src/authors/entities/author.entity';
import { GetPostsDto } from './dto/get-posts.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

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

  async create(userId: string, createPostDto: CreatePostDto, qr: QueryRunner) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`[create] User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }

    const author = await this.getOrCreateAuthor(createPostDto.book.author, qr);
    const book = await this.getOrCreateBook(createPostDto.book, author.id, qr);
    const newPost = await this.createPost(createPostDto, userId, book.isbn, qr);

    const result = await qr.manager.findOneOrFail(Post, {
      where: { id: newPost.id },
      relations: ['book', 'user', 'user.profile', 'book.author'],
    });

    this.logger.log(
      `[create] Post created successfully. PostId: ${result.id}, UserId: ${userId}, BookISBN: ${book.isbn}`,
    );

    return result;
  }

  private async getOrCreateAuthor(name: string, qr: QueryRunner) {
    let author = await this.authorRepository.findOne({
      where: { name },
    });

    if (!author) {
      author = qr.manager.create(Author, { name });
      await qr.manager.save(author);
    }

    return author;
  }

  private async getOrCreateBook(
    createBookDto: CreateBookDto,
    authorId: number,
    qr: QueryRunner,
  ) {
    let book = await this.bookRepository.findOne({
      where: { isbn: createBookDto.isbn },
    });
    if (!book) {
      book = qr.manager.create(Book, {
        ...createBookDto,
        author: { id: authorId },
      });
      await qr.manager.save(book);
    }
    return book;
  }

  private async updatePost(
    updatePostDto: UpdatePostDto,
    existingPost: Post,
    bookId: string,
    qr: QueryRunner,
  ) {
    Object.assign(existingPost, {
      title: updatePostDto.title,
      content: updatePostDto.content,
      rating: updatePostDto.rating,
      startDate: updatePostDto.startDate,
      isPrivate: updatePostDto.isPrivate,
      book: { isbn: bookId },
    });

    return await qr.manager.save(Post, existingPost);
  }

  private async createPost(
    post: CreatePostDto,
    userId: string,
    bookId: string,
    qr: QueryRunner,
  ) {
    const newPost = qr.manager.create(Post, {
      ...post,
      book: { isbn: bookId },
      user: { id: userId },
    });
    return qr.manager.save(newPost);
  }

  async findPostsByBook(isbn: string): Promise<Book | null> {
    const result = await this.findBookWithPosts(isbn);
    return result;
  }

  private async findBookWithPosts(isbn: string) {
    return await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.posts', 'post')
      .leftJoin('post.user', 'user')
      .addSelect('user.id')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.isbn = :isbn', { isbn })
      .getOne();
  }

  async findPostsByUser(
    userId: string,
    getPostsDto: GetPostsDto,
    isOwn: boolean = false,
  ) {
    const qb = this.getPostsQuerybuilder().where('post.user.id = :userId', {
      userId,
    });

    if (!isOwn)
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

  private getPostsQuerybuilder() {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.book', 'book')
      .leftJoin('post.user', 'user')
      .addSelect('user.id')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('book.author', 'author');
  }

  async findAll(getPostsDto: GetPostsDto) {
    const qb = this.getPostsQuerybuilder();
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

  private async getPostById(id: number): Promise<Post | null> {
    return this.getPostsQuerybuilder().where('post.id = :id', { id }).getOne();
  }

  async findPostById(userId: string, id: number) {
    const post = await this.getPostById(id);

    if (!post) {
      this.logger.warn(`[findPostById] Post not found: ${id}`);
      throw new NotFoundException('post not found');
    }

    if (post.isPrivate && post.user.id !== userId) {
      this.logger.warn(
        `[findPostById] Forbidden access: User ${userId} → Post ${id} (owner: ${post.user.id})`,
      );
      throw new ForbiddenException();
    }

    return post;
  }

  async update(
    id: number,
    userId: string,
    updatePostDto: UpdatePostDto,
    qr: QueryRunner,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      this.logger.warn(`[update] User not found: ${userId}`);
      throw new NotFoundException('user not found');
    }

    const existingPost = await this.getPostById(id);

    if (!existingPost) {
      this.logger.warn(`[update] Post not found: ${id}`);
      throw new NotFoundException('post not found');
    }

    if (existingPost.user.id !== userId) {
      this.logger.warn(
        `[update] Unauthorized update attempt: User ${userId} → Post ${id}`,
      );
      throw new ForbiddenException('user is not owner');
    }

    const author = await this.getOrCreateAuthor(updatePostDto.book.author, qr);
    const book = await this.getOrCreateBook(updatePostDto.book, author.id, qr);

    await this.updatePost(updatePostDto, existingPost, book.isbn, qr);

    const updatedPost = await qr.manager.findOneOrFail(Post, {
      where: { id },
      relations: ['book', 'user', 'user.profile', 'book.author'],
    });

    this.logger.log(
      `[update] PostId: ${id}, UserId: ${userId}\n` +
        `title="${updatedPost.title}" | rating="${updatedPost.rating}" | private="${updatedPost.isPrivate}" | content="${updatedPost.content}" | version=${updatedPost.version}`,
    );

    return updatedPost;
  }

  async remove(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      this.logger.warn(`[remove] Post not found: ${id}`);
      throw new NotFoundException('post not found');
    }
    await this.postRepository.softDelete(id);

    this.logger.log(`[remove] PostId: ${id}`);

    return { id };
  }
}
