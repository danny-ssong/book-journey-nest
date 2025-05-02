// import { DataSource } from 'typeorm';
// import { Book } from 'src/books/entities/book.entity';
// import { Author } from 'src/authors/entities/author.entity';
// import * as oldBooks from './data/old_book.json';
// import * as dotenv from 'dotenv';
// import { QueryRunner } from 'typeorm';
// import { SearchedBook } from 'src/books/books.service';
// import { SearchBookedMeta } from 'src/books/books.service';
// import { Post } from 'src/post/entities/post.entity';
// import { User } from 'src/users/entities/user.entity';
// import { Profile } from 'src/profiles/entities/profile.entity';

// dotenv.config();

// interface OldBook {
//   title: string;
//   author: string;
//   published_date: string;
//   isbn: string;
//   created_at: string;
//   thumbnail: string;
// }

// async function main() {
//   const ds = new DataSource({
//     type: 'postgres',
//     host: 'localhost',
//     port: 5432,
//     username: process.env.DB_USERNAME as string,
//     password: process.env.DB_PASSWORD as string,
//     database: process.env.DB_DATABASE as string,
//     entities: [Book, Author, Post, User, Profile],
//     synchronize: true,
//   });
//   await ds.initialize();

//   const queryRunner = ds.createQueryRunner();
//   await queryRunner.connect();
//   await queryRunner.startTransaction();

//   try {
//     const bookRepo = queryRunner.manager.getRepository(Book);
//     const authorRepo = queryRunner.manager.getRepository(Author);

//     for (const row of oldBooks as OldBook[]) {
//       // 1. 작가 정보 처리
//       let author = await authorRepo.findOneBy({ name: row.author });
//       if (!author) {
//         author = authorRepo.create({ name: row.author });
//         await authorRepo.save(author);
//       }

//       // 2. 책 정보 처리
//       let book = await bookRepo.findOneBy({ isbn: row.isbn });
//       if (!book) {
//         // 카카오 API를 통해 추가 정보 조회
//         const kakaoBook = await fetchKakaoBookInfo(row.isbn);

//         book = bookRepo.create({
//           isbn: row.isbn,
//           title: row.title,
//           author,
//           thumbnailUrl: row.thumbnail,
//           publishedAt: new Date(row.published_date),
//           contents: kakaoBook?.contents || '',
//           url: kakaoBook?.url || '',
//           publisher: kakaoBook?.publisher || '',
//         });
//         await bookRepo.save(book);
//       }
//     }

//     await queryRunner.commitTransaction();
//     console.log('✅ Book Migration done!');
//   } catch (err) {
//     await queryRunner.rollbackTransaction();
//     console.error('Migration failed:', err);
//   } finally {
//     await queryRunner.release();
//     await ds.destroy();
//   }
// }

// async function fetchKakaoBookInfo(isbn: string) {
//   const url = `${process.env.KAKAO_BASE_URL}/v3/search/book?target=isbn&query=${isbn}`;

//   try {
//     const response = await fetch(url, {
//       headers: {
//         Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}`,
//       },
//     });

//     if (!response.ok) throw new Error('Kakao API request failed');

//     const data = (await response.json()) as {
//       documents: SearchedBook[];
//       meta: SearchBookedMeta;
//     };
//     const book = data.documents[0];

//     return book;
//   } catch (error) {
//     console.error(`Failed to fetch book info for ISBN ${isbn}:`, error);
//     return null;
//   }
// }

// main().catch(console.error);
