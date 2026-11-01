// src/entities/Notification.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

export enum NotificationChannel {
  TELEGRAM = "TELEGRAM",
  SMS = "SMS",
  EMAIL = "EMAIL",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  userId!: number;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel!: NotificationChannel;

  @Column({ type: "text" })
  message!: string;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "text", nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
  user: any;
  content: string;
  type: any;
  sentAt: Date;
}