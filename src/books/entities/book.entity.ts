import { Author } from 'src/authors/entities/author.entity';
import { BaseTable } from 'src/common/entities/base-table.entity';
import { Post } from 'src/post/entities/post.entity';
import { Entity, Column, OneToMany, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class Book extends BaseTable {
  @PrimaryColumn()
  isbn: string;

  @Column()
  title: string;

  @Column()
  contents: string;

  @Column()
  url: string;

  @Column()
  publisher: string;

  @ManyToOne(() => Author, (author) => author.books)
  author: Author;

  @OneToMany(() => Post, (post) => post.book)
  posts: Post[];

  @Column()
  thumbnailUrl: string;

  @Column()
  publishedAt: Date;
}
