import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { TestBed } from '@automock/jest';
import { CommonService } from 'src/common/common.service';
import { Post } from './entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import { Author } from 'src/authors/entities/author.entity';
import { Book } from 'src/books/entities/book.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
describe('PostService', () => {
  let postService: PostService;
  let commonService: CommonService;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let bookRepository: Repository<Book>;
  let authorRepository: Repository<Author>;

  const mockQueryRunner = {
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnThis(),
      findOneOrFail: jest.fn(),
    },
  };

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(PostService).compile();

    postService = unit;
    commonService = unitRef.get(CommonService);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    postRepository = unitRef.get(getRepositoryToken(Post) as string);
    bookRepository = unitRef.get(getRepositoryToken(Book) as string);
    authorRepository = unitRef.get(getRepositoryToken(Author) as string);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const userId = '1';
      const createPostDto = {
        title: '테스트 포스트',
        content: '테스트 내용',
        isPrivate: false,
        book: {
          title: '테스트 책',
          isbn: '1234567890',
          author: '테스트 작가',
        },
      } as CreatePostDto;

      userRepository.findOne = jest.fn().mockResolvedValue({
        id: userId,
      } as User);

      jest.spyOn(postService as any, 'getOrCreateAuthor').mockResolvedValue({
        id: 1,
        name: createPostDto.book.author,
      } as Author);

      jest.spyOn(postService as any, 'getOrCreateBook').mockResolvedValue({
        isbn: createPostDto.book.isbn,
        title: createPostDto.book.title,
      } as Book);

      jest.spyOn(postService as any, 'createPost').mockResolvedValue({
        id: 1,
        title: createPostDto.title,
        content: createPostDto.content,
        isPrivate: createPostDto.isPrivate,
        book: {
          isbn: createPostDto.book.isbn,
          title: createPostDto.book.title,
        },
      } as Post);

      jest.spyOn(postService as any, 'findPostById').mockResolvedValue({
        id: 1,
        ...createPostDto,
      } as any);

      mockQueryRunner.manager.findOneOrFail = jest.fn().mockResolvedValue({
        id: 1,
        title: createPostDto.title,
        content: createPostDto.content,
        isPrivate: createPostDto.isPrivate,
        book: {
          isbn: createPostDto.book.isbn,
          title: createPostDto.book.title,
        },
      } as any);

      const result = await postService.create(
        userId,
        createPostDto,
        mockQueryRunner as any,
      );

      expect(result).toEqual({
        id: 1,
        title: createPostDto.title,
        content: createPostDto.content,
        isPrivate: createPostDto.isPrivate,
        book: {
          isbn: createPostDto.book.isbn,
          title: createPostDto.book.title,
        },
      });
    });
    it('should throw NotFoundException if user not found', async () => {
      const userId = '1';
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        postService.create(userId, {} as CreatePostDto, mockQueryRunner as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPostsByBook', () => {
    it('should return a book with posts', async () => {
      const isbn = '1234567890';
      const bookWithPosts = {
        isbn,
        posts: [
          {
            id: 1,
          },
          {
            id: 2,
          },
        ],
      };
      jest
        .spyOn(postService as any, 'findBookWithPosts')
        .mockResolvedValue(bookWithPosts);

      const result = await postService.findPostsByBook(isbn);
      expect(result).toEqual(bookWithPosts);
    });

    it('should throw NotFoundException if book not found', async () => {
      const isbn = '1234567890';
      jest
        .spyOn(postService as any, 'findBookWithPosts')
        .mockResolvedValue(null);
      expect(await postService.findPostsByBook(isbn)).toBeNull();
    });
  });

  describe('findPostsByUser', () => {
    let qb: any;
    let posts: Post[];
    let getPostsDto: GetPostsDto;
    let userId: string;

    beforeEach(() => {
      userId = '1';
      getPostsDto = {
        cursor: '1',
        take: 10,
        order: ['startDate_DESC'],
      } as GetPostsDto;

      posts = [
        {
          id: 1,
        } as Post,
      ];

      qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([posts, 1]),
      };

      jest
        .spyOn(postService as any, 'getPostsQuerybuilder')
        .mockReturnValue(qb);

      commonService.applyCursorPaginationParamsToQb = jest
        .fn()
        .mockResolvedValue({
          nextCursor: null,
        } as any);
    });

    it('should return posts by user and does not include private posts in qb', async () => {
      const result = await postService.findPostsByUser(
        userId,
        getPostsDto,
        false,
      );

      expect(qb.where).toHaveBeenCalledWith('post.user.id = :userId', {
        userId,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('post.isPrivate = :isPrivate', {
        isPrivate: false,
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, getPostsDto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: posts,
        nextCursor: null,
        count: 1,
      });
    });
    it('should return posts by user and include private posts in qb', async () => {
      const result = await postService.findPostsByUser(
        userId,
        getPostsDto,
        true,
      );

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, getPostsDto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: posts,
        nextCursor: null,
        count: 1,
      });
    });
  });

  describe('findPostById', () => {
    it('should return a post by post id', async () => {
      const userId = '1';
      const id = 1;
      const post = {
        id,
        isPrivate: true,
        user: { id: userId },
      } as Post;
      jest.spyOn(postService as any, 'getPostById').mockResolvedValue(post);

      const result = await postService.findPostById(userId, id);
      expect(result).toEqual(post);
    });

    it('should throw NotFoundException if post is not found', async () => {
      const userId = '1';
      const id = 1;
      jest.spyOn(postService as any, 'getPostById').mockResolvedValue(null);
      await expect(postService.findPostById(userId, id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if post is private and is not owned by the user', async () => {
      const userId = '1';
      const id = 1;
      const post = {
        id,
        isPrivate: true,
        user: { id: '2' },
      } as Post;

      jest.spyOn(postService as any, 'getPostById').mockResolvedValue(post);

      await expect(postService.findPostById(userId, id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const userId = '1';
      const id = 1;
      const author = { id: 1, name: '테스트 작가' } as Author;
      const updateDto = {
        title: '테스트 포스트',
        content: '테스트 내용',
        isPrivate: false,
        book: {
          title: '테스트 책',
          isbn: '1234567890',
          author: author.name,
        },
      } as UpdatePostDto;

      userRepository.findOne = jest
        .fn()
        .mockResolvedValue({ id: userId } as User);

      jest
        .spyOn(postService as any, 'getOrCreateAuthor')
        .mockResolvedValue({ id: 1, name: updateDto.book.author } as Author);

      jest.spyOn(postService as any, 'getOrCreateBook').mockResolvedValue({
        isbn: updateDto.book.isbn,
        title: updateDto.book.title,
      } as Book);

      const mockPost = { id, ...updateDto, user: { id: userId } };

      jest.spyOn(postService as any, 'updatePost').mockResolvedValue(null);

      jest.spyOn(postService as any, 'getPostById').mockResolvedValue(mockPost);

      mockQueryRunner.manager.findOneOrFail = jest
        .fn()
        .mockResolvedValue({ id, ...updateDto, user: { id: userId } });

      const result = await postService.update(
        id,
        userId,
        updateDto,
        mockQueryRunner as any,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });

      expect((postService as any).getOrCreateAuthor).toHaveBeenCalledWith(
        updateDto.book.author,
        mockQueryRunner as any,
      );

      expect((postService as any).getOrCreateBook).toHaveBeenCalledWith(
        updateDto.book,
        author.id,
        mockQueryRunner as any,
      );

      expect((postService as any).updatePost).toHaveBeenCalledWith(
        updateDto,
        mockPost,
        updateDto.book.isbn,
        mockQueryRunner as any,
      );

      expect(mockQueryRunner.manager.findOneOrFail).toHaveBeenCalledWith(Post, {
        where: { id },
        relations: ['book', 'user', 'user.profile', 'book.author'],
      });

      expect(result).toEqual({ id, ...updateDto, user: { id: userId } });
    });
  });

  describe('remove', () => {
    it('should remove a post', async () => {
      const id = 1;
      const post = { id } as Post;
      postRepository.findOne = jest.fn().mockResolvedValue(post);

      const result = await postService.remove(id);
      expect(result).toEqual({ id });
    });

    it('should throw NotFoundException if post is not found', async () => {
      const id = 1;
      postRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(postService.remove(id)).rejects.toThrow(NotFoundException);
    });
  });
});
