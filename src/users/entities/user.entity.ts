import { Exclude } from 'class-transformer';
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
import { v4 as uuidv4 } from 'uuid';

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  @Exclude()
  email: string;

  @Column({
    enum: Role,
    default: Role.USER,
  })
  @Exclude()
  role: Role;

  @Column()
  @Exclude()
  name: string;

  @Column()
  @Exclude()
  thirdPartyId: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  @Exclude()
  refreshToken: string | null;

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];
}
