import { Controller, Get, UseGuards, Req, Res, Query, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Sẽ redirect sang Google login page
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const loginData = await this.authService.login(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    
    // Redirect về Frontend kèm token và thông tin user
    return res.redirect(
      `${frontendUrl}/auth-callback?token=${loginData.token}&userId=${loginData.user.id}&username=${encodeURIComponent(
        loginData.user.username,
      )}&avatarUrl=${encodeURIComponent(loginData.user.avatarUrl || '')}`,
    );
  }

  @Get('mock-login/:userId')
  async mockLogin(@Param('userId') userIdStr: string) {
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid User ID');
    }

    const loginData = await this.authService.getMockUserToken(userId);
    if (!loginData) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      success: true,
      data: loginData,
    };
  }
}
