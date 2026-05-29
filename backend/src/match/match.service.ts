import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { Group } from '../entities/group.entity';
import { UserGroup } from '../entities/user-group.entity';
import { User } from '../entities/user.entity';
import { TournamentPrediction } from '../entities/tournament-prediction.entity';
import * as crypto from 'crypto';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TournamentPrediction)
    private readonly tpRepository: Repository<TournamentPrediction>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  // 1. Lấy danh sách trận đấu và dự đoán của người dùng
  async getMatchesForUser(userId?: number): Promise<any[]> {
    const matches = await this.matchRepository.find({
      order: { startTime: 'ASC' },
    });

    const predictions = userId
      ? await this.predictionRepository.find({
          where: { userId },
        })
      : [];

    const predictionMap = new Map<number, Prediction>();
    predictions.forEach((p) => predictionMap.set(p.matchId, p));

    return matches.map((match) => {
      const pred = predictionMap.get(match.id);
      return {
        ...match,
        userPrediction: pred
          ? {
              predHomeScore: pred.predHomeScore,
              predAwayScore: pred.predAwayScore,
              pointsEarned: pred.pointsEarned,
              createdAt: pred.createdAt,
            }
          : null,
      };
    });
  }

  // 2. Dự đoán trận đấu (Cập nhật hoặc Thêm mới) - Khóa trước 15 phút
  async predictMatch(
    userId: number,
    matchId: number,
    predHomeScore: number,
    predAwayScore: number,
  ): Promise<Prediction> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === 'finished') {
      throw new BadRequestException('Match has already finished');
    }

    // Kiểm tra thời gian khóa kèo (15 phút trước giờ đá)
    const now = new Date();
    const lockTime = new Date(match.startTime.getTime() - 15 * 60 * 1000);
    if (now >= lockTime) {
      throw new ForbiddenException('Prediction is locked (closed 15 minutes before kickoff)');
    }

    let prediction = await this.predictionRepository.findOne({
      where: { userId, matchId },
    });

    if (prediction) {
      prediction.predHomeScore = predHomeScore;
      prediction.predAwayScore = predAwayScore;
      prediction.createdAt = new Date(); // Cập nhật dấu thời gian
    } else {
      prediction = this.predictionRepository.create({
        userId,
        matchId,
        predHomeScore,
        predAwayScore,
        createdAt: new Date(),
      });
    }

    const savedPrediction = await this.predictionRepository.save(prediction);

    // Invalidate cache leaderboard liên quan đến user này
    await this.invalidateUserGroupsCache(userId);

    return savedPrediction;
  }

  // 3. Tạo nhóm mới
  async createGroup(ownerId: number, name: string): Promise<Group> {
    const group = this.groupRepository.create({
      name,
      inviteCode: crypto.randomUUID(),
    });

    const savedGroup = await this.groupRepository.save(group);

    const userGroup = this.userGroupRepository.create({
      userId: ownerId,
      groupId: savedGroup.id,
      role: 'owner',
    });
    await this.userGroupRepository.save(userGroup);

    return savedGroup;
  }

  // 4. Tham gia nhóm bằng invite_code
  async joinGroup(userId: number, inviteCode: string): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { inviteCode } });
    if (!group) {
      throw new NotFoundException('Group not found with this invite code');
    }

    const existingMembership = await this.userGroupRepository.findOne({
      where: { userId, groupId: group.id },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already a member of this group');
    }

    const userGroup = this.userGroupRepository.create({
      userId,
      groupId: group.id,
      role: 'member',
    });
    await this.userGroupRepository.save(userGroup);

    // Clear cache leaderboard của nhóm này
    await this.cacheManager.del(`leaderboard:${group.id}`);

    return group;
  }

  // Lấy các nhóm mà user tham gia
  async getUserGroups(userId: number): Promise<Group[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { userId },
      relations: { group: true },
    });
    return userGroups.map((ug) => ug.group);
  }

  // Rời khỏi nhóm
  async leaveGroup(userId: number, groupId: number): Promise<void> {
    const membership = await this.userGroupRepository.findOne({
      where: { userId, groupId },
    });
    if (!membership) {
      throw new NotFoundException('Bạn không phải là thành viên của nhóm này');
    }

    if (membership.role === 'owner') {
      const totalMembers = await this.userGroupRepository.count({
        where: { groupId },
      });

      if (totalMembers > 1) {
        throw new BadRequestException('Chủ nhóm không thể rời nhóm khi nhóm còn thành viên khác!');
      }

      // Nếu chủ nhóm là thành viên duy nhất, xóa nhóm và membership
      await this.userGroupRepository.remove(membership);
      await this.groupRepository.delete(groupId);
    } else {
      // Thành viên bình thường rời nhóm
      await this.userGroupRepository.remove(membership);
    }

    // Xóa cache bảng xếp hạng của nhóm này
    await this.cacheManager.del(`leaderboard:${groupId}`);
  }

  // 5. Tính toán Bảng xếp hạng Nhóm (Leaderboard) hỗ trợ Tie-break
  async getGroupLeaderboard(groupId: number, userId: number): Promise<any> {
    // Kiểm tra thành viên nhóm
    const userInGroup = await this.userGroupRepository.findOne({
      where: { userId, groupId },
    });
    if (!userInGroup) {
      throw new ForbiddenException('You do not belong to this group');
    }

    // Đọc từ cache trước
    const cacheKey = `leaderboard:${groupId}`;
    const cachedResult = await this.cacheManager.get<any>(cacheKey);
    if (cachedResult) {
      if (Array.isArray(cachedResult)) {
        return { leaderboard: cachedResult, isOutrightFinalized: false };
      }
      return cachedResult;
    }

    // Lấy toàn bộ thành viên nhóm
    const members = await this.userGroupRepository.find({
      where: { groupId },
      relations: { user: true },
    });

    const memberIds = members.map((m) => m.userId);
    if (memberIds.length === 0) return [];

    // Lấy toàn bộ dự đoán của các thành viên
    const predictions = await this.predictionRepository.find({
      where: { userId: In(memberIds) },
    });

    // Lấy dự đoán Outright (Tiên tri dài hạn)
    const outrights = await this.tpRepository.find({
      where: { userId: In(memberIds) },
    });

    // Lấy bảng xếp hạng thực tế để so khớp
    const standingsResponse = await this.getActualStandings();
    const actualStandingsMap = new Map<string, string[]>();
    if (standingsResponse && standingsResponse.standings) {
      for (const st of standingsResponse.standings) {
        const groupName = st.group;
        const table = st.table || [];
        const teamsInOrder = table.map((row: any) => row.team ? (row.team.shortName || row.team.name) : '');
        actualStandingsMap.set(groupName, teamsInOrder);
      }
    }

    // Tìm đội đầu tiên rời giải (FIRST_OUT)
    const firstOutTeam = await this.getFirstOutTeam(standingsResponse);

    // Lấy danh sách Vua phá lưới thực tế (GOLDEN_BOOT)
    const actualGoldenBootList = await this.getActualGoldenBoot();

    // Xác định đội vô địch thực tế (WINNER) dựa trên kết quả trận chung kết (stage = 'FINAL')
    const finalMatch = await this.matchRepository.findOne({
      where: { stage: 'FINAL', status: 'finished' }
    });
    let actualWinner: string | null = null;
    if (finalMatch && finalMatch.homeScore !== null && finalMatch.awayScore !== null) {
      if (finalMatch.homeScore > finalMatch.awayScore) {
        actualWinner = finalMatch.homeTeam;
      } else if (finalMatch.awayScore > finalMatch.homeScore) {
        actualWinner = finalMatch.awayTeam;
      }
    }

    const leaderboard = members.map((member) => {
      const userPreds = predictions.filter((p) => p.userId === member.userId);
      const matchPoints = userPreds.reduce((sum, p) => sum + p.pointsEarned, 0);
      
      const perfectMatchesCount = userPreds.filter((p) => p.pointsEarned === 3).length;

      // 1. Tính điểm dự đoán vòng bảng (group_stage) -> +10 điểm nếu trúng cả nhất & nhì bảng
      const groupStagePred = outrights.find((o) => o.userId === member.userId && o.type === 'group_stage');
      let groupStagePoints = 0;
      if (groupStagePred) {
        try {
          const predObj = JSON.parse(groupStagePred.value);
          for (const groupName of Object.keys(predObj)) {
            const predOrder = predObj[groupName] || [];
            const actualOrder = actualStandingsMap.get(groupName) || [];
            if (predOrder.length >= 2 && actualOrder.length >= 2) {
              if (predOrder[0] === actualOrder[0] && predOrder[1] === actualOrder[1]) {
                groupStagePoints += 10; // +10 điểm cho mỗi bảng đấu đúng cả đầu & nhì bảng
              }
            }
          }
        } catch (e) {
          this.logger.error('Failed to parse group stage prediction for user ' + member.userId);
        }
      }

      // 2. Tính điểm dự đoán WINNER (+20 điểm nếu đúng đội vô địch)
      const winnerPred = outrights.find((o) => o.userId === member.userId && o.type === 'winner');
      const isWinnerCorrect = actualWinner && winnerPred ? (winnerPred.value === actualWinner) : false;
      const winnerPoints = isWinnerCorrect ? 20 : 0;

      // 3. Tính điểm dự đoán FIRST_OUT (+10 điểm nếu đúng đội bị loại đầu tiên)
      const firstOutPred = outrights.find((o) => o.userId === member.userId && o.type === 'first_out');
      const isFirstOutCorrect = firstOutTeam && firstOutPred ? (firstOutPred.value === firstOutTeam) : false;
      const firstOutPoints = isFirstOutCorrect ? 10 : 0;

      // 4. Tính điểm dự đoán GOLDEN_BOOT (+15 điểm nếu đúng vua phá lưới)
      const goldenBootPred = outrights.find((o) => o.userId === member.userId && o.type === 'golden_boot');
      const isGoldenBootCorrect = goldenBootPred && actualGoldenBootList.includes(goldenBootPred.value);
      const goldenBootPoints = isGoldenBootCorrect ? 15 : 0;

      const totalPoints = matchPoints + groupStagePoints + winnerPoints + firstOutPoints + goldenBootPoints;

      // 5. Lấy thời gian created_at của tiên tri sớm nhất làm tie-break cuối cùng
      const earliestProphecyTime = [winnerPred, firstOutPred, groupStagePred, goldenBootPred]
        .filter(Boolean)
        .map((o: any) => o.createdAt.getTime())
        .reduce((min, time) => (time < min ? time : min), Infinity);

      return {
        userId: member.userId,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        role: member.role,
        totalPoints,
        perfectMatchesCount,
        predictionsCount: userPreds.length,
        hasWinnerPrediction: !!isWinnerCorrect,
        earliestProphecyTime: earliestProphecyTime === Infinity ? Date.now() : earliestProphecyTime,
      };
    });

    // Sắp xếp theo Tie-break Hierarchy:
    // 1. Tổng điểm cao nhất (gồm tỷ số + vòng bảng + first_out)
    // 2. Đoán đúng đội vô địch (WINNER)
    // 3. Có số trận đạt 3 điểm tuyệt đối nhiều nhất
    // 4. Thời gian dự đoán WINNER/FIRST_OUT/GROUP_STAGE sớm nhất
    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.hasWinnerPrediction !== a.hasWinnerPrediction) {
        return (b.hasWinnerPrediction ? 1 : 0) - (a.hasWinnerPrediction ? 1 : 0);
      }
      if (b.perfectMatchesCount !== a.perfectMatchesCount) {
        return b.perfectMatchesCount - a.perfectMatchesCount;
      }
      return a.earliestProphecyTime - b.earliestProphecyTime;
    });

    const isOutrightFinalized = !!actualWinner && actualGoldenBootList.length > 0 && !!firstOutTeam;
    const result = {
      leaderboard,
      isOutrightFinalized,
    };

    // Lưu cache trong 1 phút
    await this.cacheManager.set(cacheKey, result, 60 * 1000);

    return result;
  }

  async getActualStandings(): Promise<any> {
    const cacheKey = 'wc_actual_standings';
    let cached = await this.cacheManager.get<any>(cacheKey);
    if (!cached) {
      try {
        cached = await this.fetchFromApi('/v4/competitions/WC/standings');
        if (cached) {
          // Lưu cache trong 1 ngày
          await this.cacheManager.set(cacheKey, cached, 24 * 60 * 60 * 1000);
        }
      } catch (e: any) {
        this.logger.error('Failed to fetch actual standings: ' + e.message);
      }
    }
    return cached;
  }

  async getActualGoldenBoot(): Promise<string[]> {
    const cacheKey = 'wc_actual_golden_boot';
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchFromApi('/v4/competitions/WC/scorers');
      if (!response || !response.scorers || response.scorers.length === 0) return [];

      const maxGoals = response.scorers[0].goals;
      const winners = response.scorers
        .filter((s: any) => s.goals === maxGoals)
        .map((s: any) => s.player.name);

      await this.cacheManager.set(cacheKey, winners, 60 * 60 * 1000); // 1 hour cache
      return winners;
    } catch (e: any) {
      this.logger.error('Failed to fetch actual golden boot from API: ' + e.message);
      return [];
    }
  }

  async getFirstOutTeam(actualStandings: any): Promise<string | null> {
    if (!actualStandings || !actualStandings.standings) return null;

    const tableRowsWithElimination: { teamName: string; lastMatchTime: number }[] = [];

    // Lấy toàn bộ các trận đấu đã hoàn thành để so sánh thời gian kết thúc bảng đấu
    const allMatches = await this.matchRepository.find({
      where: { status: 'finished' }
    });

    for (const st of actualStandings.standings) {
      const table = st.table || [];
      const groupFinished = table.length > 0 && table.every((row: any) => row.playedGames >= 3);
      if (groupFinished) {
        const fourthPlace = table.find((row: any) => row.position === 4);
        if (fourthPlace && fourthPlace.team) {
          const teamName = fourthPlace.team.shortName || fourthPlace.team.name;
          const groupMatches = allMatches.filter(m => m.groupName === st.group);
          const lastMatchTime = groupMatches.reduce((max, m) => {
            const t = new Date(m.startTime).getTime();
            return t > max ? t : max;
          }, 0);
          tableRowsWithElimination.push({ teamName, lastMatchTime });
        }
      }
    }

    if (tableRowsWithElimination.length === 0) return null;
    // Sắp xếp tăng dần theo thời gian trận đấu muộn nhất của bảng đấu -> bảng nào đá xong trước thì đội bét bảng bị loại trước
    tableRowsWithElimination.sort((a, b) => a.lastMatchTime - b.lastMatchTime);
    return tableRowsWithElimination[0].teamName;
  }

  // 6. Cập nhật Dự đoán Dài hạn (Outright Predictions)
  async saveTournamentPrediction(
    userId: number,
    type: 'winner' | 'first_out' | 'golden_boot' | 'group_stage',
    value: string,
  ): Promise<TournamentPrediction> {
    // Quy tắc: Chỉ được dự đoán trước khi giải đấu khai mạc (15 phút trước trận đầu tiên)
    const earliestMatch = await this.matchRepository.findOne({
      where: {},
      order: { startTime: 'ASC' },
    });
    if (earliestMatch) {
      const startTime = new Date(earliestMatch.startTime).getTime();
      const lockTime = startTime - 15 * 60 * 1000;
      if (Date.now() >= lockTime) {
        throw new BadRequestException('Thời gian dự đoán dài hạn đã đóng (giải đấu đã bắt đầu)!');
      }
    }

    let outright = await this.tpRepository.findOne({
      where: { userId, type },
    });

    if (outright) {
      outright.value = value;
    } else {
      outright = this.tpRepository.create({
        userId,
        type,
        value,
      });
    }

    return this.tpRepository.save(outright);
  }

  async getTournamentPredictions(userId: number): Promise<TournamentPrediction[]> {
    return this.tpRepository.find({ where: { userId } });
  }

  // 7. Worker CronJob tự động cập nhật kết quả trận đấu & tính điểm (Cứ mỗi 5 phút)
  @Cron('*/5 * * * *')
  async handleCronMatches() {
    this.logger.log('CronJob: Scanning matches for automatic score updates & point calculation...');
    try {
      await this.syncMatchesFromApi();
    } catch (e: any) {
      this.logger.error('CronJob: API sync failed, falling back to local simulation. Error: ' + e.message);
      await this.updateFinishedMatchesAndPoints();
    }
  }

  // Cho phép chạy thủ công qua API để test/demo lập tức
  async updateFinishedMatchesAndPoints(): Promise<number> {
    const now = new Date();
    // Lấy các trận đấu ở trạng thái scheduled đã qua thời điểm đá
    const matchesToFinish = await this.matchRepository.find({
      where: { status: 'scheduled' },
    });

    const finishedMatches = matchesToFinish.filter((m) => m.startTime <= now);
    if (finishedMatches.length === 0) {
      this.logger.log('No matches to finish.');
      return 0;
    }

    let updatedCount = 0;
    for (const match of finishedMatches) {
      // Giả lập lấy kết quả trận đấu ngẫu nhiên nếu không có dữ liệu thực tế
      const homeScore = Math.floor(Math.random() * 4); // 0 -> 3
      const awayScore = Math.floor(Math.random() * 4); // 0 -> 3

      match.homeScore = homeScore;
      match.awayScore = awayScore;
      match.status = 'finished';

      await this.matchRepository.save(match);
      this.logger.log(`Match ${match.homeTeam} vs ${match.awayTeam} finalized with score ${homeScore}-${awayScore}`);

      // Tính điểm cho các user dự đoán trận đấu này
      const predictions = await this.predictionRepository.find({
        where: { matchId: match.id },
      });

      for (const pred of predictions) {
        pred.pointsEarned = this.calculatePoints(
          pred.predHomeScore,
          pred.predAwayScore,
          homeScore,
          awayScore,
        );
        await this.predictionRepository.save(pred);
      }

      updatedCount++;
    }

    if (updatedCount > 0) {
      // Clear toàn bộ cache bảng xếp hạng của mọi nhóm
      await this.clearAllLeaderboardCaches();
    }

    return updatedCount;
  }

  // Logic tính điểm 3/1/0
  private calculatePoints(
    predHome: number,
    predAway: number,
    realHome: number,
    realAway: number,
  ): number {
    // 1. Trúng tỷ số chính xác tuyệt đối -> 3 điểm
    if (predHome === realHome && predAway === realAway) {
      return 3;
    }

    // 2. Trúng xu hướng (W/D/L) -> 1 điểm
    const realDiff = realHome - realAway;
    const predDiff = predHome - predAway;

    if (
      (realDiff > 0 && predDiff > 0) || // Đội nhà thắng
      (realDiff < 0 && predDiff < 0) || // Đội khách thắng
      (realDiff === 0 && predDiff === 0) // Hòa
    ) {
      return 1;
    }

    // 3. Sai xu hướng -> 0 điểm
    return 0;
  }

  private async invalidateUserGroupsCache(userId: number) {
    const userGroups = await this.userGroupRepository.find({ where: { userId } });
    for (const ug of userGroups) {
      await this.cacheManager.del(`leaderboard:${ug.groupId}`);
    }
  }

  private async clearAllLeaderboardCaches() {
    this.logger.log('Clearing all leaderboard caches due to score updates.');
    // Do cache-manager bản mới không hỗ trợ clear pattern trực tiếp dễ dàng, 
    // chúng ta sẽ xóa cache khi có truy vấn mới hoặc nếu dùng Redis.
    // Ở đây cache TTL là 60s, nhưng ta có thể xóa các khóa cụ thể bằng cách lấy danh sách nhóm
    const groups = await this.groupRepository.find();
    for (const g of groups) {
      await this.cacheManager.del(`leaderboard:${g.id}`);
    }
  }

  // Giao tiếp với API football-data.org bên ngoài
  private fetchFromApi(path: string): Promise<any> {
    const apiKey = this.configService.get<string>('FOOTBALL_DATA_API_KEY') || '';
    return new Promise((resolve, reject) => {
      const https = require('https');
      const options = {
        hostname: 'api.football-data.org',
        path,
        method: 'GET',
        headers: {
          'X-Auth-Token': apiKey,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`API responded with status code ${res.statusCode}: ${data}`));
              return;
            }
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.end();
    });
  }

  // Đồng bộ hóa trận đấu từ API
  async syncMatchesFromApi(): Promise<number> {
    try {
      this.logger.log('Syncing matches from football-data.org...');
      const response = await this.fetchFromApi('/v4/competitions/WC/matches');
      if (!response || !response.matches) {
        this.logger.warn('No matches found in API response.');
        return 0;
      }

      let count = 0;
      for (const apiMatch of response.matches) {
        const externalId = apiMatch.id;
        const homeTeamName = apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || 'Chưa xác định';
        const awayTeamName = apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || 'Chưa xác định';
        const homeCrest = apiMatch.homeTeam?.crest || null;
        const awayCrest = apiMatch.awayTeam?.crest || null;
        const startTime = new Date(apiMatch.utcDate);
        const status = apiMatch.status === 'FINISHED' ? 'finished' : 'scheduled';
        const groupName = apiMatch.group || null;
        const stage = apiMatch.stage || null;
        
        // football-data.org v4 returns scores in fullTime
        const homeScore = apiMatch.score?.fullTime?.home;
        const awayScore = apiMatch.score?.fullTime?.away;

        let match = await this.matchRepository.findOne({ where: { externalId } });

        if (match) {
          let hasChanges = false;
          if (match.groupName !== groupName) {
            match.groupName = groupName;
            hasChanges = true;
          }
          if (match.stage !== stage) {
            match.stage = stage;
            hasChanges = true;
          }
          if (match.homeTeam !== homeTeamName) {
            match.homeTeam = homeTeamName;
            hasChanges = true;
          }
          if (match.awayTeam !== awayTeamName) {
            match.awayTeam = awayTeamName;
            hasChanges = true;
          }
          if (match.homeCrest !== homeCrest) {
            match.homeCrest = homeCrest;
            hasChanges = true;
          }
          if (match.awayCrest !== awayCrest) {
            match.awayCrest = awayCrest;
            hasChanges = true;
          }
          if (match.status !== status) {
            match.status = status;
            hasChanges = true;
          }
          if (homeScore !== undefined && match.homeScore !== homeScore) {
            match.homeScore = homeScore;
            hasChanges = true;
          }
          if (awayScore !== undefined && match.awayScore !== awayScore) {
            match.awayScore = awayScore;
            hasChanges = true;
          }
          if (match.startTime.getTime() !== startTime.getTime()) {
            match.startTime = startTime;
            hasChanges = true;
          }

          if (hasChanges) {
            await this.matchRepository.save(match);
            
            // Nếu trận đấu hoàn thành, tính điểm cho các dự đoán tương ứng
            if (status === 'finished' && homeScore !== null && awayScore !== null) {
              const predictions = await this.predictionRepository.find({
                where: { matchId: match.id },
              });
              for (const pred of predictions) {
                pred.pointsEarned = this.calculatePoints(
                  pred.predHomeScore,
                  pred.predAwayScore,
                  homeScore,
                  awayScore,
                );
                await this.predictionRepository.save(pred);
              }
            }
            count++;
          }
        } else {
          // Tạo mới nếu chưa tồn tại
          match = this.matchRepository.create({
            externalId,
            homeTeam: homeTeamName,
            awayTeam: awayTeamName,
            homeCrest,
            awayCrest,
            startTime,
            status,
            homeScore: homeScore ?? null,
            awayScore: awayScore ?? null,
            groupName,
            stage,
          });
          await this.matchRepository.save(match);
          count++;
        }
      }

      if (count > 0) {
        await this.clearAllLeaderboardCaches();
      }

      this.logger.log(`Successfully synced ${count} matches from football-data.org.`);
      return count;
    } catch (error: any) {
      this.logger.error('Error syncing matches from API: ' + error.message);
      throw error;
    }
  }

  async getTeamsAndSquads(): Promise<any[]> {
    const cacheKey = 'wc_teams_and_squads';
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 1. Lấy danh sách areas từ API để map sang châu lục (parentArea)
      const areasResponse = await this.fetchFromApi('/v4/areas');
      const areasMap = new Map<number, string>();
      if (areasResponse && areasResponse.areas) {
        for (const area of areasResponse.areas) {
          areasMap.set(area.id, area.parentArea);
        }
      }

      // 2. Lấy danh sách bảng đấu từ API để map nhóm (group) cho các đội
      const standingsResponse = await this.fetchFromApi('/v4/competitions/WC/standings');
      const teamGroupMap = new Map<number, string>();
      if (standingsResponse && standingsResponse.standings) {
        for (const st of standingsResponse.standings) {
          const groupName = st.group;
          if (st.table) {
            for (const row of st.table) {
              if (row.team) {
                teamGroupMap.set(row.team.id, groupName);
              }
            }
          }
        }
      }

      // 3. Lấy danh sách các đội tuyển
      const response = await this.fetchFromApi('/v4/competitions/WC/teams');
      if (!response || !response.teams) {
        return [];
      }

      const continentTranslation: { [key: string]: string } = {
        'Europe': 'Châu Âu',
        'South America': 'Nam Mỹ',
        'Africa': 'Châu Phi',
        'Asia': 'Châu Á',
        'N/C America': 'Bắc & Trung Mỹ',
        'Oceania': 'Châu Đại Dương',
      };

      const mapped = response.teams.map((t: any) => {
        const parentArea = t.area ? areasMap.get(t.area.id) : null;
        const continent = parentArea
          ? (continentTranslation[parentArea] || parentArea)
          : 'Khác / Chưa Phân Nhóm';

        const group = t.id ? (teamGroupMap.get(t.id) || 'Chưa chia bảng') : 'Chưa chia bảng';

        return {
          id: t.id,
          name: t.name,
          shortName: t.shortName || t.name,
          crest: t.crest,
          continent,
          group,
          squad: t.squad
            ? t.squad.map((p: any) => ({
                id: p.id,
                name: p.name,
                position: p.position,
              }))
            : [],
        };
      });

      // Cache for 2 months (2 * 30 * 24 * 60 * 60 * 1000 ms)
      await this.cacheManager.set(cacheKey, mapped, 2 * 30 * 24 * 60 * 60 * 1000);
      return mapped;
    } catch (err: any) {
      this.logger.error('Failed to fetch teams and squads from API: ' + err.message);
      return [];
    }
  }
}
