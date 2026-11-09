// src/entities/Review.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

export enum ReviewStatus {
  APPROVE = "APPROVE",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  REJECTED = "REJECTED",
}

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  taskId!: number;

  @ManyToOne(() => Task, (task) => task.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ type: "int" })
  reviewerId!: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reviewer_id" })
  reviewer!: User;

  @Column({
    type: "enum",
    enum: ReviewStatus,
  })
  status!: ReviewStatus;

  @Column({ type: "text", nullable: true })
  comments!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}