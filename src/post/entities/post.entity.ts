import { Book } from 'src/books/entities/book.entity';
import { BaseTable } from 'src/common/entities/base-table.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class Post extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  content: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @ManyToOne(() => Book, (book) => book.posts)
  book: Book;

  @Column()
  rating: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  isPrivate: boolean;
}
