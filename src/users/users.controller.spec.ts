import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TestBed } from '@automock/jest';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let userController: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(UsersController).compile();

    userController = unit;
    usersService = unitRef.get(UsersService);
  });

  describe('findAll', () => {
    it('should call usersService.findAll and return users', async () => {
      const users = [{ id: 1 }, { id: 2 }] as User[];
      usersService.findAll = jest.fn().mockResolvedValue(users);

      const result = await userController.findAll();
      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOneWithProfile and return user with profile', async () => {
      const user = { id: 1, profile: { id: 1 } } as User;
      usersService.findOneWithProfile = jest.fn().mockResolvedValue(user);

      const result = await userController.findOne(1);
      expect(usersService.findOneWithProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
  });

  describe('getMe', () => {
    it('should call usersService.findOneWithProfile and return user with profile', async () => {
      const user = { id: 1, profile: { id: 1 } } as User;
      usersService.findOneWithProfile = jest.fn().mockResolvedValue(user);

      const result = await userController.getMe(1);
      expect(usersService.findOneWithProfile).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    });
  });
});
