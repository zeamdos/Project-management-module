
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Skill } from "./Skill";

@Entity("user_skills")
@Unique(["userId", "skillId"])
export class UserSkill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.userSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  skillId!: number;

  @ManyToOne(() => Skill, (skill) => skill.userSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "skill_id" })
  skill!: Skill;

  @Column({ default: 1 })
  proficiency!: number; // 1 to 5

  @Column({ default: false })
  confirmed!: boolean;
}