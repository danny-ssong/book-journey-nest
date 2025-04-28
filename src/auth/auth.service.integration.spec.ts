import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Profile } from 'src/profiles/entities/profile.entity';
import { DataSource } from 'typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { Post } from 'src/post/entities/post.entity';
import { Book } from 'src/books/entities/book.entity';
import { Author } from 'src/authors/entities/author.entity';
import { Repository } from 'typeorm';

describe('Auth Service - Integration Test', () => {
  let authService: AuthService;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let users: User[];
  let profiles: Profile[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Post, Book, Author, User, Profile]),
        ConfigModule.forRoot(),
        JwtModule.register({}),
      ],
      providers: [AuthService, UsersService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(Profile);

    profiles = [1, 2].map((id) =>
      profileRepository.create({
        id: id,
        nickname: `user${id}`,
        avatarUrl: `https://avatar.com/user${id}`,
        bio: `bio of user${id}`,
      }),
    );

    await profileRepository.save(profiles);

    users = [1, 2].map((id) =>
      userRepository.create({
        id: id,
        email: `user${id}@test.com`,
        name: `name${id}`,
        thirdPartyId: `thirdPartyId${id}`,
        profile: profiles[id - 1],
        refreshToken: id % 2 !== 0 ? `refreshToken${id}` : undefined,
      }),
    );

    await userRepository.save(users);
  });

  describe('issueAccessToken', () => {
    it('should issue access token', async () => {
      const accessToken = await authService.issueAccessToken(users[0]);
      expect(accessToken).toBeDefined();
    });
  });

  describe('issueRefreshToken', () => {
    it('should issue refresh token', async () => {
      const refreshToken = await authService.issueRefreshToken(users[0]);
      expect(refreshToken).toBeDefined();
    });
  });

  describe('validateOAuthLogin', () => {
    it('should validate oauth login', async () => {
      const result = await authService.validateOAuthLogin(
        users[0].thirdPartyId,
        users[0].email,
        users[0].name,
      );
      expect(result).toBeDefined();
      expect(result.id).toEqual(users[0].id);
    });

    it('should create user if not exist', async () => {
      const createUserDto: CreateUserDto = {
        thirdPartyId: 'thirdPartyId3',
        email: 'user3@test.com',
        name: 'name3',
      };

      const result = await authService.validateOAuthLogin(
        createUserDto.thirdPartyId,
        createUserDto.email,
        createUserDto.name,
      );

      expect(result).toBeDefined();
      expect(result.thirdPartyId).toEqual(createUserDto.thirdPartyId);
      expect(result.email).toEqual(createUserDto.email);
      expect(result.name).toEqual(createUserDto.name);
    });
  });

  describe('login', () => {
    it('should login', async () => {
      const { accessToken, refreshToken } = await authService.login(users[0]);

      const user = await userRepository.findOne({
        where: { id: users[0].id },
      });

      expect(user?.refreshToken).toBe(refreshToken);
    });
  });

  describe('clearRefreshToken', () => {
    it('should be null refresh token in user db', async () => {
      await authService.clearRefreshToken(users[0].id);
      const user = await userRepository.findOne({
        where: { id: users[0].id },
      });
      expect(user?.refreshToken).toBeNull();
    });
  });
});
