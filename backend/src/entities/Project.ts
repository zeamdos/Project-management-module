import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { Team } from "./Team";
import { Task } from "./Task";
import { Milestone } from "./Milestone";
import { Repository } from "./Repository";
import { Policy } from "./Policy";

@Entity("projects")
export class Project {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orgId!: number;

  @ManyToOne(() => Organization, (org) => org.projects, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column()
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ default: 7 })
  updateIntervalDays!: number; // 3 or 7 days

  // Final deadline set by the PM (teams get earlier deadlines worked out from this one)
  @Column({ type: "timestamp", nullable: true })
  deadline!: Date | null;

  // Extra rules from the PM: technology to use, must-haves, and so on
  @Column({ type: "text", nullable: true })
  requirements!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Team, (team) => team.project, { cascade: true })
  teams!: Team[];

  @OneToMany(() => Task, (task) => task.project, { cascade: true })
  tasks!: Task[];

  @OneToMany(() => Milestone, (milestone) => milestone.project, { cascade: true })
  milestones!: Milestone[];

  @OneToMany(() => Repository, (repo) => repo.project, { cascade: true })
  repositories!: Repository[];

  @OneToMany(() => Policy, (policy) => policy.project, { cascade: true })
  policies!: Policy[];
}