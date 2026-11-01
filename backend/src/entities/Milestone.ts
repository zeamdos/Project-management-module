import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Project } from "./Project";
import { Task } from "./Task";

export enum MilestoneStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

@Entity("milestones")
export class Milestone {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  projectId!: number;

  @ManyToOne(() => Project, (project) => project.milestones, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status!: MilestoneStatus;

  @Column({ type: "timestamp", nullable: true })
  dueDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.milestone)
  tasks!: Task[];
}