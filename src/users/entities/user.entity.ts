import { BaseTable } from 'src/common/entities/base-table.entity';
import { Post } from 'src/post/entities/post.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  Column,
  JoinColumn,
} from 'typeorm';

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  thirdPartyId: string;
}
