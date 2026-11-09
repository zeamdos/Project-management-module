// src/entities/Policy.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Project } from "./Project";

@Entity("policies")
export class Policy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  projectId!: number;

  @ManyToOne(() => Project, (p) => p.policies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "varchar" })
  key!: string; // e.g., 'require_approved_review_for_done'

  @Column({ type: "boolean", default: true })
  enabled!: boolean;
}