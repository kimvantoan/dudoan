import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('tournament_predictions')
export class TournamentPrediction {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ type: 'enum', enum: ['winner', 'first_out', 'golden_boot', 'group_stage'] })
  type: 'winner' | 'first_out' | 'golden_boot' | 'group_stage';

  @Column({ type: 'text' })
  value: string;

  @ManyToOne(() => User, (user) => user.tournamentPredictions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
