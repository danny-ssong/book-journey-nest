import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/profiles/entities/profile.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepository.findOne({
      where: { id: user.profile.id },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const newProfile = this.profileRepository.create({
      ...profile,
      ...updateProfileDto,
    });

    return this.profileRepository.save(newProfile);
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
