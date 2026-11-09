// src/entities/EscalationRule.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Project } from "./Project";
import { UserRole } from "./User";

@Entity("escalation_rules")
export class EscalationRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  projectId!: number;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({
    type: "enum",
    enum: UserRole,
  })
  targetRole!: UserRole;

  @Column({ type: "varchar" })
  triggerCondition!: string; // e.g., 'OVERDUE_TASK', 'BLOCKED_TASK', 'MISSED_UPDATE'

  @Column({ type: "int" })
  thresholdHours!: number;
}