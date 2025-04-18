import { Author } from 'src/authors/entities/author.entity';
import { BaseTable } from 'src/common/entities/base-table.entity';

import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';

@Entity()
export class Profile extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nickname: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  bio: string;

  @OneToOne(() => User, (user) => user.profile)
  user: User;

  @ManyToMany(() => Author)
  @JoinTable()
  mostReadAuthors: Author[];
}
