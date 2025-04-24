import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TestBed } from '@automock/jest';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryRunner } from 'typeorm';
import { Post } from './entities/post.entity';
import { GetPostsDto } from './dto/get-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Book } from 'src/books/entities/book.entity';

describe('PostController', () => {
  let postController: PostController;
  let postService: PostService;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.create(PostController).compile();
    postController = unit;
    postService = unitRef.get(PostService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call postService.create and return created post', async () => {
      const createPostDto = {
        title: 'title',
        content: 'contetn',
      } as CreatePostDto;
      const userId = 1;
      const qr = {} as QueryRunner;
      const post = {
        id: 1,
        title: 'title',
        content: 'content',
      } as Post;

      postService.create = jest.fn().mockResolvedValue(post);

      const result = await postController.create(userId, createPostDto, qr);

      expect(postService.create).toHaveBeenCalledWith(
        userId,
        createPostDto,
        qr,
      );
      expect(result).toEqual(post);
    });
  });

  describe('findAll', () => {
    it('should call postService.findAll and return posts', async () => {
      const getPostsDto = {
        cursor: '1',
        take: 10,
      } as GetPostsDto;

      const posts = [
        { id: 1, title: 'title', content: 'content' },
        { id: 2, title: 'title2', content: 'content2' },
      ];

      const returnValue = {
        data: posts as Post[],
        nextCursor: null,
        count: posts.length,
      };

      postService.findAll = jest.fn().mockResolvedValue(returnValue);

      const result = await postController.findAll(getPostsDto);

      expect(postService.findAll).toHaveBeenCalledWith(getPostsDto);
      expect(result).toEqual(returnValue);
    });
  });

  describe('findMyPosts', () => {
    it('should call postService.findPostsByUser and return posts', async () => {
      const userId = 1;
      const getPostsDto = {
        cursor: ' 1',
        take: 10,
      } as GetPostsDto;

      const posts = [
        { id: 1, title: 'title', content: 'content' },
        { id: 2, title: 'title2', content: 'content2' },
      ];

      const returnValue = {
        data: posts as Post[],
        nextCursor: null,
        count: posts.length,
      };

      postService.findPostsByUser = jest.fn().mockResolvedValue(returnValue);

      const result = await postController.findMyPosts(userId, getPostsDto);

      expect(postService.findPostsByUser).toHaveBeenCalledWith(
        userId,
        getPostsDto,
        true,
      );
      expect(result).toEqual(returnValue);
    });
  });

  describe('findUserPosts', () => {
    it('should call postService.findPostsByUser and return posts', async () => {
      const userId = 1;
      const getPostsDto = {
        cursor: '1',
        take: 10,
      } as GetPostsDto;

      const posts = [
        { id: 1, title: 'title', content: 'content' },
        { id: 2, title: 'title2', content: 'content2' },
      ];

      const returnValue = {
        data: posts as Post[],
        nextCursor: null,
        count: posts.length,
      };

      postService.findPostsByUser = jest.fn().mockResolvedValue(returnValue);

      const result = await postController.findUserPosts(getPostsDto, userId);

      expect(postService.findPostsByUser).toHaveBeenCalledWith(
        userId,
        getPostsDto,
        false,
      );
      expect(result).toEqual(returnValue);
    });
  });

  describe('findBookPosts', () => {
    it('should call postService.findPostsByBook and return posts', async () => {
      const isbn = '1234567890';
      const posts = [
        { id: 1, title: 'title', content: 'content' },
        { id: 2, title: 'title2', content: 'content2' },
      ];

      const book = {
        isbn: isbn,
        title: 'title',
        posts: posts as Post[],
      } as Book;

      postService.findPostsByBook = jest.fn().mockResolvedValue(book);

      const result = await postController.findBookPosts(isbn);

      expect(postService.findPostsByBook).toHaveBeenCalledWith(isbn);
      expect(result).toEqual(book);
    });
  });

  describe('findOne', () => {
    it('should call postService.findPostById and return post', async () => {
      const userId = 1;
      const id = 1;
      const post = {
        id: 1,
        title: 'title',
        content: 'content',
      } as Post;

      postService.findPostById = jest.fn().mockResolvedValue(post);

      const result = await postController.findOne(userId, id);

      expect(postService.findPostById).toHaveBeenCalledWith(userId, id);
      expect(result).toEqual(post);
    });
  });

  describe('update', () => {
    it('should call postService.update and return updated post', async () => {
      const id = 1;
      const userId = 1;
      const updatePostDto = {
        title: 'updatedTitle',
      } as UpdatePostDto;
      const qr = {} as QueryRunner;
      const post = {
        id: 1,
        title: 'updatedTitle',
        content: 'content',
      } as Post;

      postService.update = jest.fn().mockResolvedValue(post);

      const result = await postController.update(id, userId, updatePostDto, qr);

      expect(postService.update).toHaveBeenCalledWith(
        id,
        userId,
        updatePostDto,
        qr,
      );
      expect(result).toEqual(post);
    });

    describe('remove', () => {
      it('should call postService.remove and return deleted post', async () => {
        const post = { id: 1, title: 'title', content: 'content' } as Post;

        postService.remove = jest.fn().mockResolvedValue({ id: post.id });

        const result = await postController.remove(1);

        expect(result).toEqual({ id: post.id });
      });
    });
  });
});
