import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('admin_config')
export class AdminConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  description: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
