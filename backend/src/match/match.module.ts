import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { Group } from '../entities/group.entity';
import { UserGroup } from '../entities/user-group.entity';
import { User } from '../entities/user.entity';
import { TournamentPrediction } from '../entities/tournament-prediction.entity';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Match,
      Prediction,
      Group,
      UserGroup,
      User,
      TournamentPrediction,
    ]),
  ],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
