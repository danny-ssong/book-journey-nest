import { Book } from 'src/books/entities/book.entity';
import { Min, Max } from 'class-validator';
import { BaseTable } from 'src/common/entities/base-table.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Post extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  content: string;

  @Column({ type: 'integer' })
  @Min(0)
  @Max(5)
  rating: number;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  isPrivate: boolean;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  user: User;

  @ManyToOne(() => Book, (book) => book.posts)
  book: Book;
}
