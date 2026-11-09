// src/entities/AuditLog.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Organization } from "./Organization";
import { User } from "./User";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  orgId!: number;

  @ManyToOne(() => Organization, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "int", nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "varchar" })
  action!: string; // CREATE, UPDATE, DELETE

  @Column({ type: "varchar" })
  entityName!: string;

  @Column({ type: "int" })
  entityId!: number;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}