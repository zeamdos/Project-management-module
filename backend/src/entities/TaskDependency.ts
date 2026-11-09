// src/entities/TaskDependency.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Task } from "./Task";

@Entity("task_dependencies")
@Unique(["taskId", "dependsOnTaskId"])
export class TaskDependency {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  taskId!: number;

  @ManyToOne(() => Task, (task) => task.dependencies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column()
  dependsOnTaskId!: number;

  @ManyToOne(() => Task, { onDelete: "CASCADE" })
  @JoinColumn({ name: "depends_on_task_id" })
  dependsOnTask!: Task;
}