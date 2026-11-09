import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Team } from "./Team";
import { User } from "./User";

@Entity("team_members")
@Unique(["teamId", "userId"])
export class TeamMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  teamId!: number;

  @ManyToOne(() => Team, (team) => team.teamMembers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.teamMembers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ default: false })
  isLead!: boolean;
}