// src/entities/Skill.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Organization } from "./Organization";
import { UserSkill } from "./UserSkill";
import { TaskRequiredSkill } from "./TaskRequiredSkill";

@Entity("skills")
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  orgId!: number;

  @ManyToOne(() => Organization, (org) => org.skills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  organization!: Organization;

  @Column()
  name!: string;

  @OneToMany(() => UserSkill, (us) => us.skill, { cascade: true })
  userSkills!: UserSkill[];

  @OneToMany(() => TaskRequiredSkill, (trs) => trs.skill, { cascade: true })
  taskRequiredSkills!: TaskRequiredSkill[];
}