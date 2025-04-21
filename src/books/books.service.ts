import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Book } from './entities/book.entity';
import { SearchBookDto } from './dto/search-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface SearchedBook {
  authors: string[];
  contents: string;
  datetime: string;
  isbn: string;
  price: number;
  publisher: string;
  sale_price: number;
  status: string;
  thumbnail: string; //url
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
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}

  async findOne(isbn: string) {
    let book: Book | SearchedBook | null = null;

    book = await this.booksRepository.findOne({
      where: { isbn },
    });
    if (!book) {
      const searchResult = await this.searchBooks({
        queryString: isbn,
        size: 5,
        page: 1,
      });
      book = searchResult.documents[0];
    }
    if (!book) throw new NotFoundException('Book not found');

    return book;
  }

  async searchBooks(searchBookDto: SearchBookDto) {
    const { queryString, size, page } = searchBookDto;
    const url = `${process.env.KAKAO_BASE_URL}/v3/search/book?target=title&query=${encodeURIComponent(
      queryString,
    )}&size=${size}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = (await response.json()) as {
        documents: SearchedBook[];
        meta: SearchBookedMeta;
      };

      const uniqueBooks = this.removeDuplicatedBooks(data.documents);
      const booksUsingIsbn13 = this.removeIsbn10(uniqueBooks);

      return {
        ...data,
        documents: booksUsingIsbn13,
      };
    } catch (error) {
      throw new InternalServerErrorException(`kakao api error \n ${error}`);
    }
  }

  private removeDuplicatedBooks(books: SearchedBook[]) {
    const uniqueBookIdentifiers = new Set();

    const uniqueBooks = books.filter((book: SearchedBook) => {
      const identifiler = `${book.title}-${book.authors[0]}-${book.translators[0]}`;
      if (uniqueBookIdentifiers.has(identifiler)) return false;

      uniqueBookIdentifiers.add(identifiler);
      return true;
    });

    return uniqueBooks;
  }

  private removeIsbn10(books: SearchedBook[]) {
    // isbn
    // ISBN10(10자리) 또는 ISBN13(13자리) 형식의 국제 표준 도서번호(International Standard Book Number)
    // ISBN10 또는 ISBN13 중 하나 이상 포함
    // 두 값이 모두 제공될 경우 공백(' ')으로 구분
    // 따라서 isbn13만 추출하여 book의 primary key로 사용
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
