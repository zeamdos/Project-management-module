// src/entities/Repository.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Project } from "./Project";
import { GitActivity } from "./GitActivity";

@Entity("repositories")
export class Repository {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  projectId!: number;

  @ManyToOne(() => Project, (project) => project.repositories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column()
  url!: string;

  @Column({ select: false })
  webhookSecret!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => GitActivity, (ga) => ga.repository, { cascade: true })
  gitActivities!: GitActivity[];
}