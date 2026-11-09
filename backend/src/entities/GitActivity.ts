// src/entities/GitActivity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Repository } from "./Repository";
import { User } from "./User";
import { Task } from "./Task";

export enum GitActivityType {
  COMMIT = "COMMIT",
  PULL_REQUEST = "PULL_REQUEST",
  PR_REVIEW = "PR_REVIEW",
}

@Entity("git_activities")
export class GitActivity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  repositoryId!: number;

  @ManyToOne(() => Repository, (repo) => repo.gitActivities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "repository_id" })
  repository!: Repository;

  @Column({ type: "int", nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "int", nullable: true })
  taskId!: number | null;

  @ManyToOne(() => Task, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "task_id" })
  task!: Task | null;

  @Column({
    type: "enum",
    enum: GitActivityType,
  })
  activityType!: GitActivityType;

  @Column({ type: "varchar" })
  externalId!: string; // commit hash or PR ID

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", nullable: true })
  url!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}