import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    username: string;
    avatarUrl: string;
  }): Promise<any> {
    try {
      let user = await this.userRepository.findOne({
        where: [{ googleId: profile.googleId }, { email: profile.email }],
      });

      if (!user) {
        user = this.userRepository.create({
          googleId: profile.googleId,
          email: profile.email,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
        });
        user = await this.userRepository.save(user);
      } else {
        // Cập nhật thông tin nếu cần
        user.username = profile.username || user.username;
        user.avatarUrl = profile.avatarUrl || user.avatarUrl;
        user = await this.userRepository.save(user);
      }

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Error validating Google user: ' + error.message);
    }
  }

  async login(user: User) {
    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.userId,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async getMockUserToken(userId: number) {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      return null;
    }
    return this.login(user);
  }
}
