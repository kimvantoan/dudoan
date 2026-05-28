import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserGroup } from './user-group.entity';
import { Prediction } from './prediction.entity';
import { TournamentPrediction } from './tournament-prediction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'google_id', unique: true, length: 255 })
  googleId: string;

  @Column({ length: 50 })
  username: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.user)
  userGroups: UserGroup[];

  @OneToMany(() => Prediction, (prediction) => prediction.user)
  predictions: Prediction[];

  @OneToMany(() => TournamentPrediction, (tp) => tp.user)
  tournamentPredictions: TournamentPrediction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
