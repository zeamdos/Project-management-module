import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Project } from "./Project";
import { Team } from "./Team";
import { Skill } from "./Skill";

@Entity("organizations")
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];

  @OneToMany(() => Project, (project) => project.organization)
  projects!: Project[];

  @OneToMany(() => Team, (team) => team.organization)
  teams!: Team[];

  @OneToMany(() => Skill, (skill) => skill.organization)
  skills!: Skill[];
}