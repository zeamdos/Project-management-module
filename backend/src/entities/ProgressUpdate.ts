// src/entities/ProgressUpdate.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Project } from "./Project";
import { User } from "./User";

@Entity("progress_updates")
export class ProgressUpdate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  projectId!: number;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "int" })
  userId!: number;

  @ManyToOne(() => User, (user) => user.progressUpdates, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "text" })
  workDone!: string;

  @Column({ type: "text" })
  nextSteps!: string;

  @Column({ type: "text", nullable: true })
  blockers!: string | null;

  @Column({ type: "int" })
  confidence!: number; // e.g., 1-5 or percentage

  @CreateDateColumn()
  createdAt!: Date;
}