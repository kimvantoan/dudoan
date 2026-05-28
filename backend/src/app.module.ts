import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { UserGroup } from './entities/user-group.entity';
import { Match } from './entities/match.entity';
import { Prediction } from './entities/prediction.entity';
import { TournamentPrediction } from './entities/tournament-prediction.entity';
import { AuthModule } from './auth/auth.module';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'dudoan_user'),
        password: configService.get<string>('DB_PASSWORD', 'dudoan_password'),
        database: configService.get<string>('DB_DATABASE', 'dudoan_db'),
        entities: [User, Group, UserGroup, Match, Prediction, TournamentPrediction],
        synchronize: true, // Tự động sync DB schema trong môi trường dev
      }),
    }),
    TypeOrmModule.forFeature([User, Group, UserGroup, Match, Prediction, TournamentPrediction]),
    AuthModule,
    MatchModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000, // Cache mặc định 60 giây
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
