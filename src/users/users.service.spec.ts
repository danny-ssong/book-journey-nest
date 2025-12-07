import { UsersService } from './users.service';
import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersService', () => {
  let userService: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(UsersService).compile();

    userService = unit;
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    dataSource = unitRef.get(DataSource);

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          execute: jest.fn(),
        }),
      },
    } as any as jest.Mocked<QueryRunner>;

    jest.clearAllMocks();
  });

  describe('createWithProfile', () => {
    it('should create a user and a profile with third party Id(google OAuth)', async () => {
      dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner);

      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        thirdPartyId: '1234567890',
        name: 'test',
      };

      const profileCreationResult = { identifiers: [{ id: '1' }] };
      const userCreationResult = { identifiers: [{ id: '1' }] };
      queryRunner.manager.createQueryBuilder().execute = jest
        .fn()
        .mockResolvedValueOnce(profileCreationResult)
        .mockResolvedValueOnce(userCreationResult);

      const newUser = {
        id: '2',
        profileId: 1,
        ...createUserDto,
      };

      queryRunner.manager.findOne = jest.fn().mockResolvedValueOnce(newUser);

      const result = await userService.createWithProfile(createUserDto);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(newUser);
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw internal server error if profile creation fails', async () => {
      dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner);

      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        thirdPartyId: '1234567890',
        name: 'test',
      };

      queryRunner.manager.createQueryBuilder().execute = jest
        .fn()
        .mockRejectedValueOnce(new Error('Profile creation failed'));

      await expect(
        userService.createWithProfile(createUserDto),
      ).rejects.toThrow(Error);
    });

    it('should throw internal server error if user creation fails', async () => {
      dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner);

      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        thirdPartyId: '1234567890',
        name: 'test',
      };

      queryRunner.manager.createQueryBuilder().execute = jest
        .fn()
        .mockRejectedValueOnce(new Error('User creation failed'));

      await expect(
        userService.createWithProfile(createUserDto),
      ).rejects.toThrow(Error);
    });

    it('should throw internal server error if user not found', async () => {
      dataSource.createQueryRunner = jest.fn().mockReturnValue(queryRunner);

      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        thirdPartyId: '1234567890',
        name: 'test',
      };

      const profileCreationResult = { identifiers: [{ id: 1 }] };
      const userCreationResult = { identifiers: [{ id: 1 }] };
      queryRunner.manager.createQueryBuilder().execute = jest
        .fn()
        .mockResolvedValueOnce(profileCreationResult)
        .mockResolvedValueOnce(userCreationResult);

      queryRunner.manager.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        userService.createWithProfile(createUserDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return users', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];

      userRepository.find = jest.fn().mockResolvedValue(users);
      const result = await userService.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('findOneWithProfile', () => {
    it('should return user if user exists', async () => {
      const user = { id: '1', profile: { id: 1 } } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(user);
      const result = await userService.findOneWithProfile('1');

      expect(result).toEqual(user);
    });
  });

  describe('findUserByThirdPartyId', () => {
    it('should return user if user exists', async () => {
      const user = { id: '1', thirdPartyId: '1234567890' } as User;

      userRepository.findOne = jest.fn().mockResolvedValue(user);
      const result = await userService.findUserByThirdPartyId('1234567890');

      expect(result).toEqual(user);
    });
  });
});
