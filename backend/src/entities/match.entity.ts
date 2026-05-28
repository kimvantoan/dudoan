import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Prediction } from './prediction.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'external_id', type: 'int', nullable: true })
  externalId: number | null;

  @Column({ name: 'home_team', length: 100 })
  homeTeam: string;

  @Column({ name: 'away_team', length: 100 })
  awayTeam: string;

  @Column({ name: 'home_crest', type: 'varchar', length: 255, nullable: true })
  homeCrest: string | null;

  @Column({ name: 'away_crest', type: 'varchar', length: 255, nullable: true })
  awayCrest: string | null;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ type: 'enum', enum: ['scheduled', 'finished'], default: 'scheduled' })
  status: 'scheduled' | 'finished';

  @Column({ name: 'home_score', type: 'int', nullable: true })
  homeScore: number | null;

  @Column({ name: 'away_score', type: 'int', nullable: true })
  awayScore: number | null;

  @Column({ name: 'group_name', type: 'varchar', length: 50, nullable: true })
  groupName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  stage: string | null;

  @OneToMany(() => Prediction, (prediction) => prediction.match)
  predictions: Prediction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
