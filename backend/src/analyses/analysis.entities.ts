import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Call } from '../calls/entities';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  // quality | complaint | lead
  @Column({ type: 'varchar' })
  flow: string;

  // PROCESSING | DONE | FAILED
  @Column({ type: 'varchar', default: 'PROCESSING' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  result: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  // low | medium | high | urgent
  @Column({ type: 'varchar', default: 'medium' })
  priority: string;

  // OPEN | IN_PROGRESS | RESOLVED
  @Column({ type: 'varchar', default: 'OPEN' })
  status: string;

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'int', default: 0 })
  score: number;

  // hot | warm | cold (tính từ score)
  @Column({ type: 'varchar', default: 'cold' })
  stage: string;

  @Column({ type: 'text', nullable: true })
  interest: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}