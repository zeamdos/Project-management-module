import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { Project } from "./Project";
import { TeamMember } from "./TeamMember";
import { Task } from "./Task";

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orgId!: number;

  @ManyToOne(() => Organization, (org) => org.teams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "int" })
  projectId!: number;

  @ManyToOne(() => Project, (project) => project.teams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column()
  name!: string;

  @Column({ type: "timestamp", nullable: true })
  deadline!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TeamMember, (tm) => tm.team, { cascade: true })
  teamMembers!: TeamMember[];

  @OneToMany(() => Task, (task) => task.team)
  tasks!: Task[];
}