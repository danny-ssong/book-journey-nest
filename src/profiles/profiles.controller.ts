import {
  Controller,
  Body,
  Patch,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/strategy/jwt.strategy';

@Controller('profiles')
@UseInterceptors(ClassSerializerInterceptor)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(req.user.sub, updateProfileDto);
  }
}
