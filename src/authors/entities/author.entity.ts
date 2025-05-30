import { Exclude } from 'class-transformer';
import { Book } from 'src/books/entities/book.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';

@Entity()
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];

  @ManyToMany(() => Profile, (profile) => profile.mostReadAuthors)
  readers: Profile[];

  @Exclude()
  declare updatedAt: Date;

  @Exclude()
  declare createdAt: Date;
}
