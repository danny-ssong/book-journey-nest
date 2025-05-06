import { BooksController } from './books.controller';
import { BooksService, SearchBookedMeta, SearchedBook } from './books.service';
import { TestBed } from '@automock/jest';

describe('BooksController', () => {
  let booksController: BooksController;
  let booksService: jest.Mocked<BooksService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(BooksController).compile();

    booksController = unit;
    booksService = unitRef.get(BooksService);

    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should call booksService.findOne and return book', async () => {
      const isbn = '1234567890123';
      booksService.findOne = jest.fn().mockResolvedValue({
        isbn,
        title: 'test',
      } as SearchedBook);

      const result = await booksController.findOne(isbn);
      expect(booksService.findOne).toHaveBeenCalledWith(isbn);

      expect(result).toEqual({
        isbn,
        title: 'test',
      });
    });
  });

  describe('searchBooks', () => {
    it('should call booksService.searchBooks and return searched books', async () => {
      const mockSearchDto = {
        query: 'test',
        size: 10,
        page: 1,
      };

      const searchedBooks = [
        { isbn: '1234567890123', title: 'test' },
        { isbn: '1234567890124', title: 'test2' },
      ] as SearchedBook[];

      booksService.searchBooks = jest.fn().mockResolvedValue({
        documents: searchedBooks,
        meta: {} as SearchBookedMeta,
      });

      const result = await booksController.searchBooks(mockSearchDto);
      expect(booksService.searchBooks).toHaveBeenCalledWith(mockSearchDto);

      expect(result).toEqual({
        documents: searchedBooks,
        meta: {} as SearchBookedMeta,
      });
    });
  });
});
