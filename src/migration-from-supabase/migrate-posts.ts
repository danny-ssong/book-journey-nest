import { DataSource } from 'typeorm';
import { Post } from 'src/post/entities/post.entity';
import { Book } from 'src/books/entities/book.entity';
import { User } from 'src/users/entities/user.entity';
import { Author } from 'src/authors/entities/author.entity';
import * as oldPosts from './data/old_posts.json';
import * as oldUsers from './data/old_users.json';
import * as oldProfiles from './data/old_profile.json';
import * as oldBooks from './data/old_book.json';
import * as dotenv from 'dotenv';
import { QueryRunner } from 'typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';

dotenv.config();
interface OldPost {
  id: number;
  user_id: string;
  isbn: string;
  rating: string;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_DATABASE as string,
    entities: [Post, Book, User, Author, Profile],
    synchronize: true,
  });
  await ds.initialize();

  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const postRepo = queryRunner.manager.getRepository(Post);
    const bookRepo = queryRunner.manager.getRepository(Book);
    const authorRepo = queryRunner.manager.getRepository(Author);
    const userRepo = queryRunner.manager.getRepository(User);

    for (const row of oldPosts as OldPost[]) {
      const user = await userRepo.findOneBy({ id: row.user_id });
      if (!user) {
        console.log(`User not found: ${row.user_id}`);
        return;
      }

      const book = await bookRepo.findOne({
        where: { isbn: row.isbn },
        relations: ['author'],
      });
      if (!book) {
        console.log(`Book not found: ${row.isbn}`);
        return;
      }
      const author = await authorRepo.findOneBy({ id: book.author.id });
      if (!author) {
        console.log(`Author not found: ${row.isbn}`);
        return;
      }

      const post = postRepo.create({
        rating: Number(row.rating),
        title: row.title,
        content: row.content,
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        isPrivate: row.is_private,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        user,
        book,
      });
      await postRepo.save(post);
    }

    await queryRunner.commitTransaction();
    console.log('✅ Post Migration done!');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Migration failed:', err);
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

main().catch(console.error);
