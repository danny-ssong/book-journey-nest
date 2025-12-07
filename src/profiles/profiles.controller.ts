import {
  Controller,
  Body,
  Patch,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/strategy/jwt.strategy';
import { UserId } from 'src/common/decorator/user-id.decorator';

@Controller('profiles')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Patch('me')
  update(@UserId() userId: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(userId, updateProfileDto);
  }
}
