import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';

@Entity('predictions')
@Index(['userId', 'matchId'], { unique: true })
export class Prediction {
  @PrimaryGeneratedColumn({ name: 'pred_id' })
  predId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'match_id' })
  matchId: number;

  @Column({ name: 'pred_home_score', type: 'tinyint' })
  predHomeScore: number;

  @Column({ name: 'pred_away_score', type: 'tinyint' })
  predAwayScore: number;

  @Column({ name: 'points_earned', type: 'tinyint', default: 0 })
  pointsEarned: number;

  @Index('idx_prediction_created_at')
  @Column({ name: 'created_at', type: 'datetime', precision: 3, default: () => 'CURRENT_TIMESTAMP(3)' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.predictions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Match, (match) => match.predictions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;
}
