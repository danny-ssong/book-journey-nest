import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryRunner } from 'typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createWithProfile(createUserDto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const profile = await this.createProfile(queryRunner);
      const profileId = profile.identifiers[0].id as number;

      const user = await this.createUser(queryRunner, createUserDto, profileId);
      const userId = user.identifiers[0].id as string;

      const newUser = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!newUser) throw new InternalServerErrorException('User not found');

      await queryRunner.commitTransaction();
      return newUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private createUser(
    queryRunner: QueryRunner,
    createUserDto: CreateUserDto,
    profileId: number,
  ) {
    return queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        ...createUserDto,
        profile: {
          id: profileId,
        },
      })
      .execute();
  }

  private createProfile(queryRunner: QueryRunner) {
    return queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Profile)
      .values({
        nickname: this.getRandomNickname(),
      })
      .execute();
  }

  private getRandomNickname() {
    const adjectives = ['happy', 'sad', 'angry', 'excited', 'bored', 'sleepy'];
    const nouns = ['cat', 'dog', 'bird', 'fish', 'tree', 'flower'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
      nouns[Math.floor(Math.random() * nouns.length)]
    }`;
  }

  async findUserWithRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user)
      throw new NotFoundException(
        `유저를 찾을 수 없습니다. token에 서명된 user id${userId}`,
      );

    const isRefreshTokenMatched = user.refreshToken === refreshToken;

    if (!isRefreshTokenMatched)
      throw new UnauthorizedException(
        '서명된 토큰과 리프레시 토큰이 일치하지 않습니다.',
      );

    return user;
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    await this.userRepository.update(userId, {
      refreshToken,
    });
  }

  async clearRefreshToken(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
  }

  findAll() {
    return this.userRepository.find();
  }

  findOneWithProfile(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return this.userRepository.delete(id);
  // }

  async findUserByThirdPartyId(thirdPartyId: string) {
    return await this.userRepository.findOne({ where: { thirdPartyId } });
  }
}
