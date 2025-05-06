import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Book } from './entities/book.entity';
import { SearchBookDto } from './dto/search-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from 'src/authors/entities/author.entity';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
export interface SearchedBook {
  authors: string[];
  contents: string;
  datetime: string;
  isbn: string;
  price: number;
  publisher: string;
  sale_price: number;
  status: string;
  thumbnail: string;
  title: string;
  translators: string[];
  url: string;
}

export interface SearchBookedMeta {
  is_end: boolean;
  pageable_count: number;
  total_count: number;
}

@Injectable()
export class BooksService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async findOne(isbn: string) {
    const searchResult = await this.searchBooks({
      query: isbn,
      size: 1,
      page: 1,
    });
    const book = searchResult.documents[0];
    if (!book) throw new NotFoundException('Book not found');

    const booksUsingIsbn13 = this.convertSearchedBookToBookType([book]);
    return booksUsingIsbn13?.[0];
  }

  async searchBooks(searchBookDto: SearchBookDto) {
    const { query, size, page } = searchBookDto;
    const url = `${this.configService.get(envVariableKeys.kakaoBaseUrl)}/v3/search/book?target=title&query=${encodeURIComponent(
      query,
    )}&size=${size}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${this.configService.get(
            envVariableKeys.kakaoApiKey,
          )}`,
        },
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        documents: SearchedBook[];
        meta: SearchBookedMeta;
      };
      const uniqueBooks = this.removeDuplicatedBooks(data.documents);
      const books = this.convertSearchedBookToBookType(uniqueBooks);

      return {
        ...data,
        documents: books,
      };
    } catch (error) {
      throw new InternalServerErrorException(`search book error \n ${error}`);
    }
  }

  async findAll() {
    const books = await this.bookRepository.find();
    return books;
  }

  private convertSearchedBookToBookType(searchedBooks: SearchedBook[]) {
    const booksUsingIsbn13 = this.selectPreferredIsbn(searchedBooks);

    return booksUsingIsbn13.map((searchedBook) => {
      return {
        ...searchedBook,
        author: {
          name: searchedBook.authors[0],
        },
        thumbnailUrl: searchedBook.thumbnail,
        publishedAt: new Date(searchedBook.datetime),
      };
    });
  }

  private removeDuplicatedBooks(books: SearchedBook[]) {
    const uniqueBookIdentifiers = new Set();

    const uniqueBooks = books.filter((book: SearchedBook) => {
      const identifiler = `${book.title}-${book.authors?.[0]}-${book.translators?.[0]}`;
      if (uniqueBookIdentifiers.has(identifiler)) return false;

      uniqueBookIdentifiers.add(identifiler);
      return true;
    });

    return uniqueBooks;
  }

  /**
   * ISBN10(10자리) 또는 ISBN13(13자리) 형식의 국제 표준 도서번호(International Standard Book Number)
   * ISBN10 또는 ISBN13 중 하나 이상 포함
   * 두 값이 모두 제공될 경우 공백(' ')으로 구분하여 ISBN13만을 사용하도록 변경
   *
   * @param searchedBooks - 검색된 책 리스트
   * @returns ISBN10, ISBN13이 모두 포함된 경우 ISBN13만을 사용하는 책 리스트
   */
  private selectPreferredIsbn(books: SearchedBook[]) {
    const removedIsbn10Books = books.map((book: SearchedBook) => {
      const { isbn } = book;
      const [isbn10, isbn13] = isbn.split(' ');
      return {
        ...book,
        isbn: isbn.includes(' ') ? isbn13 : isbn,
      };
    });
    return removedIsbn10Books;
  }
}
