import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Author } from 'src/authors/entities/author.entity';
import { User } from 'src/users/entities/user.entity';
import { Book } from 'src/books/entities/book.entity';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommonService } from 'src/common/common.service';
import { CreatePostDto } from './dto/create-post.dto';
import { v4 as uuidv4 } from 'uuid';

describe('Post Service - Integration Test', () => {
  let postService: PostService;
  let dataSource: DataSource;

  let users: User[];
  let profiles: Profile[];
  let authors: Author[];
  let books: Book[];
  let posts: Post[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Post, Book, Author, User, Profile]),
        ConfigModule.forRoot(),
      ],

      providers: [PostService, CommonService],
    }).compile();

    postService = module.get<PostService>(PostService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);

    const userRepository = dataSource.getRepository(User);
    const authorRepository = dataSource.getRepository(Author);
    const bookRepository = dataSource.getRepository(Book);
    const postRepository = dataSource.getRepository(Post);
    const profileRepository = dataSource.getRepository(Profile);

    profiles = [1, 2].map((id) =>
      profileRepository.create({
        id: id,
        nickname: `nickname${id}`,
        avatarUrl: `avatarUrl${id}`,
        bio: `bio${id}`,
      }),
    );

    await profileRepository.save(profiles);

    users = ['1', '2'].map((id, index) =>
      userRepository.create({
        email: `test${id}@test.com`,
        id: id,
        name: `name${id}`,
        thirdPartyId: `thirdPartyId${id}`,
        profile: profiles[index],
      }),
    );

    await userRepository.save(users);

    authors = [1, 2].map((id) =>
      authorRepository.create({
        name: `author${id}`,
      }),
    );

    await authorRepository.save(authors);

    books = [1, 2].map((id) =>
      bookRepository.create({
        isbn: `123456789011${id}`,
        title: `book${id}`,
        author: authors[id - 1],
        thumbnailUrl: `thumbnailUrl${id}`,
        url: `url${id}`,
        contents: `contents${id}`,
        publishedAt: new Date(),
        publisher: `publisher${id}`,
      }),
    );

    await bookRepository.save(books);

    posts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) =>
      postRepository.create({
        id: id,
        book: books[0],
        user: users[0],
        isPrivate: id % 2 === 0,
        content: `content${id}`,
        rating: 5,
        startDate: new Date(),
        endDate: new Date(),
      }),
    );

    await postRepository.save(posts);
  });

  describe('create', () => {
    it('should create a post and return it', async () => {
      const createPostDto: CreatePostDto = {
        title: 'title',
        content: 'content',
        rating: 5,
        startDate: new Date(),
        endDate: new Date(),
        isPrivate: false,
        book: {
          isbn: '1234567890111',
          title: 'book1',
          author: 'author1',
          thumbnailUrl: 'thumbnailUrl',
          url: 'url',
          contents: 'contents',
          publishedAt: new Date(),
          publisher: 'publisher',
        },
      };
      const result = await postService.create(
        users[0].id,
        createPostDto,
        dataSource.createQueryRunner(),
      );
      expect(result).toBeDefined();
      expect(result.title).toBe(createPostDto.title);
      expect(result.content).toBe(createPostDto.content);
      expect(result.book.isbn).toBe(createPostDto.book.isbn);
      expect(result.book.title).toBe(createPostDto.book.title);
      expect(result.book.author.name).toBe(createPostDto.book.author);
    });

    it('should create post with a new book and author if they do not exist', async () => {
      const newPost = await postService.create(
        '1',
        {
          title: '새 포스트',
          content: '새 내용',
          rating: 4,
          startDate: new Date(),
          endDate: new Date(),
          isPrivate: false,
          book: {
            isbn: '5534567890111',
            title: 'new_book',
            author: 'new_author',
            thumbnailUrl: 'new_thumbnailUrl',
            url: 'new_url',
            contents: 'new_contents',
            publishedAt: new Date(),
            publisher: 'new_publisher',
          },
        },
        dataSource.createQueryRunner(),
      );

      // 새로 생성된 book과 author가 DB에 저장되었는지 확인
      const bookRepository = dataSource.getRepository(Book);

      const savedBook = await bookRepository.findOne({
        where: { isbn: '5534567890111' },
        relations: ['author'],
      });

      expect(savedBook).toBeDefined();
      expect(savedBook?.title).toBe('new_book');
      expect(savedBook?.author).toBeDefined();
      expect(savedBook?.author.name).toBe('new_author');

      expect(newPost.book.isbn).toBe('5534567890111');
      expect(newPost.book.title).toBe('new_book');
      expect(newPost.book.author.name).toBe('new_author');
    });
  });

  describe('findPostsByBook', () => {
    it('should return a book with posts', async () => {
      const book = await postService.findPostsByBook('1234567890111');
      expect(book).toBeDefined();
      expect(book.posts.length).toBeGreaterThanOrEqual(10);
    });

    it('should throw NotFoundException if book isbn is not found', async () => {
      await expect(
        postService.findPostsByBook('7734567890110'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPostsByUser', () => {
    it('should return user own posts', async () => {
      const getPostsDto: GetPostsDto = {
        take: 10,
        order: ['startDate_DESC'],
        cursor: undefined,
      };
      const result = await postService.findPostsByUser(
        users[0].id,
        getPostsDto,
        true,
      );
      expect(result).toBeDefined();
      expect(result.data.length).toBe(10);
    });

    it('should return user posts that does not includes private posts', async () => {
      const getPostsDto: GetPostsDto = {
        take: 10,
        order: ['startDate_DESC'],
        cursor: undefined,
      };
      const result = await postService.findPostsByUser(
        users[0].id,
        getPostsDto,
        false,
      );
      expect(result).toBeDefined();
      result.data.forEach((post) => {
        expect(post.isPrivate).toBe(false);
      });
    });

    it('should return no posts if user does not have any posts', async () => {
      const getPostsDto: GetPostsDto = {
        take: 10,
        order: ['startDate_DESC'],
        cursor: undefined,
      };
      const result = await postService.findPostsByUser('7', getPostsDto, false);
      expect(result).toBeDefined();
      expect(result.data.length).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return all posts, not includes private posts', async () => {
      const result = await postService.findAll({
        take: 10,
        order: ['startDate_DESC'],
        cursor: undefined,
      });
      expect(result).toBeDefined();
      result.data.forEach((post) => {
        expect(post.isPrivate).toBe(false);
      });
    });
  });

  describe('findPostById', () => {
    it('should return  a post', async () => {
      const result = await postService.findPostById(users[0].id, 1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if post is not found', async () => {
      await expect(
        postService.findPostById(users[0].id, 20000),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if post is private and user is not owner', async () => {
      await expect(postService.findPostById(users[1].id, 2)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    const updatePostDto: UpdatePostDto = {
      title: 'updated_title',
      content: 'updated_content',
      book: {
        isbn: '7777777777777',
        title: 'updated_book',
        author: 'updated_author',
        contents: 'updated_contents',
        url: 'updated_url',
        thumbnailUrl: 'updated_thumbnailUrl',
        publishedAt: new Date(),
        publisher: 'updated_publisher',
      },
      rating: 5,
      startDate: new Date(),
      endDate: new Date(),
      isPrivate: false,
    };
    it('should update a post', async () => {
      const result = await postService.update(
        1,
        users[0].id,
        updatePostDto,
        dataSource.createQueryRunner(),
      );
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe(updatePostDto.title);
      expect(result.content).toBe(updatePostDto.content);
      expect(result.book.isbn).toBe(updatePostDto.book.isbn);
      expect(result.book.title).toBe(updatePostDto.book.title);
      expect(result.book.author.name).toBe(updatePostDto.book.author);
      expect(result.book.contents).toBe(updatePostDto.book.contents);
      expect(result.book.url).toBe(updatePostDto.book.url);
      expect(result.book.thumbnailUrl).toBe(updatePostDto.book.thumbnailUrl);
      expect(result.book.publisher).toBe(updatePostDto.book.publisher);
    });

    it('should throw NotFoundException if user is not found', async () => {
      await expect(
        postService.update(
          1,
          '20000',
          updatePostDto,
          dataSource.createQueryRunner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if post is not found', async () => {
      await expect(
        postService.update(
          20000,
          users[0].id,
          updatePostDto,
          dataSource.createQueryRunner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      await expect(
        postService.update(
          20000,
          '777',
          updatePostDto,
          dataSource.createQueryRunner(),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const result = await postService.remove(1);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if post is not found', async () => {
      await expect(postService.remove(20000)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
