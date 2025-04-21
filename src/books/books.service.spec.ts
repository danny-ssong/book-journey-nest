import { BooksService, SearchBookedMeta, SearchedBook } from './books.service';
import { TestBed } from '@automock/jest';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
describe('BooksService', () => {
  let booksService: BooksService;

  beforeEach(async () => {
    const { unit } = TestBed.create(BooksService).compile();
    booksService = unit;

    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('return a book searched from kakao api with only isbn13', async () => {
      const isbn13 = '1234567890112';
      const searchResult = {
        documents: [
          {
            isbn: `1234567890 ${isbn13}`,
            title: 'test',
          },
        ],
        meta: {},
      } as {
        documents: SearchedBook[];
        meta: SearchBookedMeta;
      };
      jest.spyOn(booksService, 'searchBooks').mockResolvedValue(searchResult);

      const result = await booksService.findOne(isbn13);
      expect(booksService.searchBooks).toHaveBeenCalledWith({
        queryString: isbn13,
        size: 1,
        page: 1,
      });

      expect(result).toEqual({
        ...searchResult.documents[0],
        isbn: isbn13,
      });
    });

    it('throw NotFoundException if book is not found', async () => {
      jest.spyOn(booksService, 'searchBooks').mockResolvedValue({
        documents: [],
        meta: { is_end: true, pageable_count: 0, total_count: 0 },
      });

      await expect(booksService.findOne('1234567890112')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('searchBooks', () => {
    const mockSearchDto = {
      queryString: '해리포터',
      size: 10,
      page: 1,
    };

    const mockApiResponse = {
      documents: [
        {
          authors: ['J.K. 롤링'],
          contents: '해리포터 시리즈...',
          isbn: '1234567890 9876543210123',
          title: '해리포터와 마법사의 돌',
          translators: ['김현수'],
        },
      ],
      meta: {},
    };

    it('return books searched from kakao api', async () => {
      const url = `${process.env.KAKAO_BASE_URL}/v3/search/book?target=title&query=${encodeURIComponent(
        mockSearchDto.queryString,
      )}&size=${mockSearchDto.size}&page=${mockSearchDto.page}`;

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const result = await booksService.searchBooks(mockSearchDto);
      expect(global.fetch).toHaveBeenCalledWith(url, {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
        },
      });

      expect(result).toEqual({
        ...mockApiResponse,
        documents: mockApiResponse.documents.map((document) => ({
          ...document,
          isbn: document.isbn.split(' ')[1],
        })),
      });
    });

    it('return unique books', async () => {
      const mockApiResponse = {
        documents: [
          {
            isbn: '1234567890 9876543210123',
            title: '해리포터와 마법사의 돌',
          },
          {
            isbn: '1234567890 9876543210123',
            title: '해리포터와 마법사의 돌',
          },
        ],
        meta: {},
      };

      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const result = await booksService.searchBooks(mockSearchDto);
      expect(result.documents.length).toBe(1);
    });

    it('throw InternalServerErrorException if kakao api error', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
      } as any);
      await expect(booksService.searchBooks(mockSearchDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
