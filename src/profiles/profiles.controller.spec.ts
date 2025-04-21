import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Profile } from './entities/profile.entity';

const mockProfilesService = {
  update: jest.fn(),
};

describe('ProfilesController', () => {
  let profilesService: ProfilesService;
  let profilesController: ProfilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: mockProfilesService,
        },
      ],
    }).compile();

    profilesController = module.get<ProfilesController>(ProfilesController);
    profilesService = module.get<ProfilesService>(ProfilesService);
  });

  describe('update', () => {
    it('should call profilesService.update and return updated profile', async () => {
      const updateProfileDto = {
        nickname: 'updatedNickName',
      };
      const expectedResult = {
        id: 1,
        nickname: 'updatedNickName',
      };
      const userId = 1;

      jest
        .spyOn(profilesService, 'update')
        .mockResolvedValue(expectedResult as Profile);

      const result = await profilesController.update(userId, updateProfileDto);
      expect(result).toEqual(expectedResult);

      expect(profilesService.update).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
    });
  });
});
