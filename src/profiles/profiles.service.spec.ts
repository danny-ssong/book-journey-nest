import { ProfilesService } from './profiles.service';
import { TestBed } from '@automock/jest';
import { Profile } from './entities/profile.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ProfilesService', () => {
  let profilesService: ProfilesService;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(ProfilesService).compile();

    profilesService = unit;
    profileRepository = unitRef.get(getRepositoryToken(Profile) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update profile', async () => {
      const userId = 1;
      const updateProfileDto = {
        nickname: 'updatedNickName',
      };
      const existingProfile = {
        id: 2,
        nickname: 'exNickName',
      };
      const updatedProfile = {
        id: 2,
        nickname: 'updatedNickName',
      };

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue({ id: userId, profile: existingProfile } as User);

      jest
        .spyOn(profileRepository, 'findOne')
        .mockResolvedValue(updatedProfile as Profile);

      const result = await profilesService.update(userId, updateProfileDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['profile'],
      });

      expect(profileRepository.update).toHaveBeenCalledWith(
        existingProfile.id,
        updateProfileDto,
      );

      expect(result).toEqual(updatedProfile);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 1;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(profilesService.update(userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if profile not found', async () => {
      const userId = 1;
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue({ id: userId } as User);

      await expect(profilesService.update(userId, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
