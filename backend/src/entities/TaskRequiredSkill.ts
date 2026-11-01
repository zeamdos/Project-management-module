// src/entities/TaskRequiredSkill.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Task } from "./Task";
import { Skill } from "./Skill";

@Entity("task_required_skills")
@Unique(["taskId", "skillId"])
export class TaskRequiredSkill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  taskId!: number;

  @ManyToOne(() => Task, (task) => task.requiredSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column()
  skillId!: number;

  @ManyToOne(() => Skill, (skill) => skill.taskRequiredSkills, { onDelete: "CASCADE" })
  @JoinColumn({ name: "skill_id" })
  skill!: Skill;
}