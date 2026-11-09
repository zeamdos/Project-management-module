import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Project } from "./Project";
import { Team } from "./Team";
import { User } from "./User";
import { Milestone } from "./Milestone";
import { TaskRequiredSkill } from "./TaskRequiredSkill";
import { TaskDependency } from "./TaskDependency";
import { Review } from "./Review";

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
  PENDING = "PENDING",
}

export enum TaskRole {
  FRONTEND = "frontend",
  BACKEND = "backend",
  UI_UX = "ui_ux",
  AI = "ai",
}

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  projectId!: number;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "int", nullable: true })
  teamId!: number | null;

  @ManyToOne(() => Team, (team) => team.tasks, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "team_id" })
  team!: Team | null;

  @Column({ type: "int", nullable: true })
  assigneeId!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee!: User | null;

  @Column({ type: "int", nullable: true })
  milestoneId!: number | null;

  @ManyToOne(() => Milestone, (milestone) => milestone.tasks, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "milestone_id" })
  milestone!: Milestone | null;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: "enum",
    enum: TaskRole,
  })
  requiredRole!: TaskRole;

  @Column({ type: "timestamp", nullable: true })
  deadline!: Date | null;

  @Column({ type: "int", nullable: true })
  parentTaskId!: number | null;

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "parent_task_id" })
  parentTask!: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask, { cascade: true })
  subtasks!: Task[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TaskRequiredSkill, (trs) => trs.task, { cascade: true })
  requiredSkills!: TaskRequiredSkill[];

  @OneToMany(() => TaskDependency, (td) => td.task, { cascade: true })
  dependencies!: TaskDependency[];

  @OneToMany(() => Review, (review) => review.task, { cascade: true })
  reviews!: Review[];
   
}