import { Author } from 'src/authors/entities/author.entity';
import { BaseTable } from 'src/common/entities/base-table.entity';
import { Post } from 'src/post/entities/post.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Book extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => Author, (author) => author.books)
  author: Author;

  @OneToMany(() => Post, (post) => post.book)
  posts: Post[];

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ unique: true })
  isbn: string;

  @Column({ nullable: true })
  thumbnailUrl: string;
}
