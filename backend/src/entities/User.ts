import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { TeamMember } from "./TeamMember";
import { UserSkill } from "./UserSkill";
import { ProgressUpdate } from "./ProgressUpdate";
import { Review } from "./Review";

export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TEAM_LEAD = "TEAM_LEAD",
  DEVELOPER = "DEVELOPER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  orgId!: number;

  @ManyToOne(() => Organization, (org) => org.users, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar", select: false })
  passwordHash!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.DEVELOPER,
  })
  role!: UserRole;

  // The team a developer belongs to: Frontend, Backend, UI/UX or AI.
  // The AI task splitter uses this to decide who gets which task.
  @Column({ type: "varchar", nullable: true })
  specialty!: string | null;

  @Column({ type: "int", nullable: true })
  assignedPmId!: number | null;

  @Column({ type: "varchar", nullable: true })
  department!: string | null;

  @Column({ type: "varchar", nullable: true })
  team!: string | null;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: "varchar", nullable: true, select: false })
  githubToken!: string | null;

  @Column({ type: "varchar", nullable: true })
  githubUsername!: string | null;

  @Column({ type: "varchar", nullable: true })
  telegramChatId!: string | null;

  @Column({ type: "varchar", nullable: true })
  phoneNumber!: string | null;

  @Column({ type: "boolean", default: true })
  notifyInApp!: boolean;

  @Column({ type: "boolean", default: true })
  notifyTelegram!: boolean;

  @Column({ type: "boolean", default: true })
  notifyEmail!: boolean;

  @Column({ type: "varchar", nullable: true })
  quietHoursStart!: string | null;

  @Column({ type: "varchar", nullable: true })
  quietHoursEnd!: string | null;

  @Column({ type: "int", default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: "timestamp", nullable: true })
  lockedUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TeamMember, (tm) => tm.user)
  teamMembers!: TeamMember[];

  @OneToMany(() => UserSkill, (us) => us.user)
  userSkills!: UserSkill[];

  @OneToMany(() => ProgressUpdate, (pu) => pu.user)
  progressUpdates!: ProgressUpdate[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviews!: Review[];
}
