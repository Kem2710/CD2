import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('calls')
export class Call {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  customerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar' })
  audioFilename: string;

  // PENDING -> PROCESSING -> DONE | FAILED
  @Column({ type: 'varchar', default: 'PENDING' })
  status: string;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('transcripts')
export class Transcript {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;
}

@Entity('summaries')
export class Summary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'varchar', default: 'neutral' })
  sentiment: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  keywords: string[];
}

@Entity('action_items')
export class ActionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  callId: number;

  @ManyToOne(() => Call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'text' })
  task: string;

  @Column({ type: 'varchar', nullable: true })
  owner: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'varchar', default: 'OPEN' })
  status: string;
}