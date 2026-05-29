import { Controller, Get, Post, Body, Query, UseGuards, Req, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { MatchService } from './match.service';

@Controller()
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  // 1. Lấy danh sách trận đấu và dự đoán của user hiện tại (hỗ trợ khách xem công khai)
  @Get('matches')
  @UseGuards(OptionalJwtAuthGuard)
  async getMatches(@Req() req) {
    const userId = req.user?.userId;
    const matches = await this.matchService.getMatchesForUser(userId);
    return {
      success: true,
      data: matches,
    };
  }

  // 2. Dự đoán tỷ số trận đấu
  @Post('predictions')
  @UseGuards(JwtAuthGuard)
  async predictMatch(
    @Req() req,
    @Body('matchId', ParseIntPipe) matchId: number,
    @Body('predHomeScore', ParseIntPipe) predHomeScore: number,
    @Body('predAwayScore', ParseIntPipe) predAwayScore: number,
  ) {
    const userId = req.user.userId;
    const prediction = await this.matchService.predictMatch(
      userId,
      matchId,
      predHomeScore,
      predAwayScore,
    );
    return {
      success: true,
      data: prediction,
    };
  }

  // 3. Tạo nhóm mới
  @Post('groups')
  @UseGuards(JwtAuthGuard)
  async createGroup(@Req() req, @Body('name') name: string) {
    const userId = req.user.userId;
    if (!name || name.trim() === '') {
      throw new BadRequestException('Group name is required');
    }
    const group = await this.matchService.createGroup(userId, name);
    return {
      success: true,
      data: group,
    };
  }

  // 4. Gia nhập nhóm bằng invite_code
  @Post('groups/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() req, @Body('inviteCode') inviteCode: string) {
    const userId = req.user.userId;
    if (!inviteCode || inviteCode.trim() === '') {
      throw new BadRequestException('Invite code is required');
    }
    const group = await this.matchService.joinGroup(userId, inviteCode);
    return {
      success: true,
      data: group,
    };
  }

  // Lấy các nhóm đã tham gia
  @Get('groups')
  @UseGuards(JwtAuthGuard)
  async getUserGroups(@Req() req) {
    const userId = req.user.userId;
    const groups = await this.matchService.getUserGroups(userId);
    return {
      success: true,
      data: groups,
    };
  }

  // Rời nhóm
  @Post('groups/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(
    @Req() req,
    @Body('groupId', ParseIntPipe) groupId: number,
  ) {
    const userId = req.user.userId;
    await this.matchService.leaveGroup(userId, groupId);
    return {
      success: true,
      message: 'Successfully left the group',
    };
  }

  // 5. Xem Bảng xếp hạng của nhóm
  @Get('predictions/leaderboard')
  @UseGuards(JwtAuthGuard)
  async getLeaderboard(
    @Req() req,
    @Query('groupId', ParseIntPipe) groupId: number,
  ) {
    const userId = req.user.userId;
    const leaderboard = await this.matchService.getGroupLeaderboard(groupId, userId);
    return {
      success: true,
      data: leaderboard,
    };
  }

  // 6. Cập nhật Dự đoán dài hạn (Winner, First Out, Golden Boot)
  @Post('tournament-predictions')
  @UseGuards(JwtAuthGuard)
  async saveTournamentPrediction(
    @Req() req,
    @Body('type') type: 'winner' | 'first_out' | 'golden_boot' | 'group_stage',
    @Body('value') value: string,
  ) {
    const userId = req.user.userId;
    if (!type || !['winner', 'first_out', 'golden_boot', 'group_stage'].includes(type)) {
      throw new BadRequestException('Invalid tournament prediction type');
    }
    if (!value || value.trim() === '') {
      throw new BadRequestException('Value is required');
    }
    const prediction = await this.matchService.saveTournamentPrediction(userId, type, value);
    return {
      success: true,
      data: prediction,
    };
  }

  @Get('tournament-predictions')
  @UseGuards(JwtAuthGuard)
  async getTournamentPredictions(@Req() req) {
    const userId = req.user.userId;
    const predictions = await this.matchService.getTournamentPredictions(userId);
    return {
      success: true,
      data: predictions,
    };
  }



  // 9. API Lấy danh sách đội tuyển và cầu thủ tham gia giải đấu từ football-data.org (Công khai)
  @Get('teams')
  async getTeams() {
    const teams = await this.matchService.getTeamsAndSquads();
    return {
      success: true,
      data: teams,
    };
  }

  // 10. API Lấy lịch sử dự đoán của một thành viên với các trận đã kết thúc
  @Get('predictions/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPredictions(
    @Param('userId', ParseIntPipe) targetUserId: number,
  ) {
    const data = await this.matchService.getUserPredictions(targetUserId);
    return {
      success: true,
      data,
    };
  }
}
