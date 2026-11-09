import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1700000000000 implements MigrationInterface {
  name = "InitSchema1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables: string[] = [
      `CREATE TABLE \`organizations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_9b7ca6d30b94fef571cff87688\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orgId\` int NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`role\` enum ('ADMIN','MANAGER','TEAM_LEAD','DEVELOPER') NOT NULL DEFAULT 'DEVELOPER',
        \`specialty\` varchar(255) NULL,
        \`assignedPmId\` int NULL,
        \`department\` varchar(255) NULL,
        \`team\` varchar(255) NULL,
        \`status\` enum ('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
        \`githubToken\` varchar(255) NULL,
        \`githubUsername\` varchar(255) NULL,
        \`telegramChatId\` varchar(255) NULL,
        \`phoneNumber\` varchar(255) NULL,
        \`notifyInApp\` tinyint NOT NULL DEFAULT 1,
        \`notifyTelegram\` tinyint NOT NULL DEFAULT 1,
        \`notifyEmail\` tinyint NOT NULL DEFAULT 1,
        \`quietHoursStart\` varchar(255) NULL,
        \`quietHoursEnd\` varchar(255) NULL,
        \`failedLoginAttempts\` int NOT NULL DEFAULT 0,
        \`lockedUntil\` timestamp NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`org_id\` int NULL,
        UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`projects\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orgId\` int NOT NULL,
        \`pmId\` int NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`status\` enum ('DRAFT','ACTIVE','ON_HOLD','ARCHIVED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
        \`techStack\` varchar(255) NULL,
        \`statusReason\` text NULL,
        \`updateIntervalDays\` int NOT NULL DEFAULT 7,
        \`deadline\` timestamp NULL,
        \`requirements\` text NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`org_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`teams\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orgId\` int NOT NULL,
        \`projectId\` int NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`deadline\` timestamp NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`org_id\` int NULL,
        \`project_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`milestones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`status\` enum ('PENDING','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'PENDING',
        \`dueDate\` timestamp NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`project_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`tasks\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`teamId\` int NULL,
        \`assigneeId\` int NULL,
        \`milestoneId\` int NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`status\` enum ('TODO','IN_PROGRESS','IN_REVIEW','DONE','BLOCKED','PENDING') NOT NULL DEFAULT 'TODO',
        \`requiredRole\` enum ('frontend','backend','ui_ux','ai') NOT NULL,
        \`deadline\` timestamp NULL,
        \`parentTaskId\` int NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`project_id\` int NULL,
        \`team_id\` int NULL,
        \`assignee_id\` int NULL,
        \`milestone_id\` int NULL,
        \`parent_task_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`repositories\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`url\` varchar(255) NOT NULL,
        \`webhookSecret\` varchar(255) NOT NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`project_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`policies\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`key\` varchar(255) NOT NULL,
        \`enabled\` tinyint NOT NULL DEFAULT 1,
        \`project_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`skills\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orgId\` int NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`org_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`user_skills\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`skillId\` int NOT NULL,
        \`proficiency\` int NOT NULL DEFAULT 1,
        \`confirmed\` tinyint NOT NULL DEFAULT 0,
        \`user_id\` int NULL,
        \`skill_id\` int NULL,
        UNIQUE INDEX \`IDX_060bea7fd45868588324719de3\` (\`userId\`, \`skillId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`task_required_skills\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`taskId\` int NOT NULL,
        \`skillId\` int NOT NULL,
        \`task_id\` int NULL,
        \`skill_id\` int NULL,
        UNIQUE INDEX \`IDX_e35ca26a28c7fd9324a8703304\` (\`taskId\`, \`skillId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`task_dependencies\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`taskId\` int NOT NULL,
        \`dependsOnTaskId\` int NOT NULL,
        \`task_id\` int NULL,
        \`depends_on_task_id\` int NULL,
        UNIQUE INDEX \`IDX_ff11847da61cdd7f74e0f832ac\` (\`taskId\`, \`dependsOnTaskId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`team_members\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`teamId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`isLead\` tinyint NOT NULL DEFAULT 0,
        \`team_id\` int NULL,
        \`user_id\` int NULL,
        UNIQUE INDEX \`IDX_b2f17b533905e0a94390c5e220\` (\`teamId\`, \`userId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`reviews\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`taskId\` int NOT NULL,
        \`reviewerId\` int NOT NULL,
        \`status\` enum ('APPROVE','CHANGES_REQUESTED','REJECTED') NOT NULL,
        \`comments\` text NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`task_id\` int NULL,
        \`reviewer_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`git_activities\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`repositoryId\` int NOT NULL,
        \`userId\` int NULL,
        \`taskId\` int NULL,
        \`activityType\` enum ('COMMIT','PULL_REQUEST','PR_REVIEW') NOT NULL,
        \`externalId\` varchar(255) NOT NULL,
        \`message\` text NOT NULL,
        \`url\` varchar(255) NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`repository_id\` int NULL,
        \`user_id\` int NULL,
        \`task_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`progress_updates\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`workDone\` text NOT NULL,
        \`nextSteps\` text NOT NULL,
        \`blockers\` text NULL,
        \`confidence\` int NOT NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`project_id\` int NULL,
        \`user_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`notifications\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`channel\` enum ('TELEGRAM','SMS','EMAIL','IN_APP') NOT NULL,
        \`kind\` varchar(255) NOT NULL DEFAULT 'GENERAL',
        \`message\` text NOT NULL,
        \`status\` enum ('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
        \`attempts\` int NOT NULL DEFAULT 0,
        \`errorMessage\` text NULL,
        \`readAt\` timestamp NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`escalation_rules\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`projectId\` int NOT NULL,
        \`targetRole\` enum ('ADMIN','MANAGER','TEAM_LEAD','DEVELOPER') NOT NULL,
        \`triggerCondition\` varchar(255) NOT NULL,
        \`thresholdHours\` int NOT NULL,
        \`project_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,

      `CREATE TABLE \`audit_logs\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`orgId\` int NOT NULL,
        \`userId\` int NULL,
        \`action\` varchar(255) NOT NULL,
        \`entityName\` varchar(255) NOT NULL,
        \`entityId\` int NOT NULL,
        \`details\` text NULL,
        \`createdAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`org_id\` int NULL,
        \`user_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    ];

    for (const sql of tables) {
      await queryRunner.query(sql);
    }

    const foreignKeys: string[] = [
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_0a13270cd3101fd16b8000e00d4\` FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`projects\` ADD CONSTRAINT \`FK_9f78c168a06314a987cf3bd401c\` FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`teams\` ADD CONSTRAINT \`FK_b729d9a1986ed0c3ae018e61310\` FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`teams\` ADD CONSTRAINT \`FK_14902fb0ff165d2b8c249b54252\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`milestones\` ADD CONSTRAINT \`FK_2204463ea4c5c1872e1fb2b8ffb\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_9eecdb5b1ed8c7c2a1b392c28d4\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_2b1604aae04e0dec6e38580e099\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_855d484825b715c545349212c7f\` FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_39abeb50240a7312a00786c9b24\` FOREIGN KEY (\`milestone_id\`) REFERENCES \`milestones\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_54fc42a253a8338488ec1f960ad\` FOREIGN KEY (\`parent_task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`repositories\` ADD CONSTRAINT \`FK_d6cd2623ff7f9e2258ebda0cb67\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`policies\` ADD CONSTRAINT \`FK_d9b794794d4f5d7341088f8178e\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`skills\` ADD CONSTRAINT \`FK_32e06a9a2308c349edfbbf634f1\` FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`user_skills\` ADD CONSTRAINT \`FK_6926002c360291df66bb2c5fdeb\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`user_skills\` ADD CONSTRAINT \`FK_eb69710b0a00f42fb95fc2ac2f5\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`task_required_skills\` ADD CONSTRAINT \`FK_5aa531fa4f4a7f484325677b9dd\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`task_required_skills\` ADD CONSTRAINT \`FK_e682960d392b058152d0f75a0a9\` FOREIGN KEY (\`skill_id\`) REFERENCES \`skills\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`task_dependencies\` ADD CONSTRAINT \`FK_1ae6688b1bd90fffe857f4cb707\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`task_dependencies\` ADD CONSTRAINT \`FK_26dedda08faccdb95aff99e112e\` FOREIGN KEY (\`depends_on_task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`team_members\` ADD CONSTRAINT \`FK_fdad7d5768277e60c40e01cdcea\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`team_members\` ADD CONSTRAINT \`FK_c2bf4967c8c2a6b845dadfbf3d4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_510ad253ff1b78940cd5565a56e\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_92e950a2513a79bb3fab273c92e\` FOREIGN KEY (\`reviewer_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`git_activities\` ADD CONSTRAINT \`FK_cf0495b0639f104f24b1c353e5d\` FOREIGN KEY (\`repository_id\`) REFERENCES \`repositories\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`git_activities\` ADD CONSTRAINT \`FK_8f77c403fbb134c52029786b540\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE \`git_activities\` ADD CONSTRAINT \`FK_9afd8c5568453ba40127399be6c\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE \`progress_updates\` ADD CONSTRAINT \`FK_fb5dd5428291df60d3a5aa52a68\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`progress_updates\` ADD CONSTRAINT \`FK_5466c7aa717c0f66ed1e401b8bb\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`escalation_rules\` ADD CONSTRAINT \`FK_1140895b0817ca82d7fb7b4ad5d\` FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`audit_logs\` ADD CONSTRAINT \`FK_8f3655b4b607ce3e7a3fb906784\` FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
      `ALTER TABLE \`audit_logs\` ADD CONSTRAINT \`FK_bd2726fd31b35443f2245b93ba0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    ];

    for (const sql of foreignKeys) {
      await queryRunner.query(sql);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const drops: string[] = [
      `DROP TABLE IF EXISTS \`audit_logs\``,
      `DROP TABLE IF EXISTS \`escalation_rules\``,
      `DROP TABLE IF EXISTS \`notifications\``,
      `DROP TABLE IF EXISTS \`progress_updates\``,
      `DROP TABLE IF EXISTS \`git_activities\``,
      `DROP TABLE IF EXISTS \`reviews\``,
      `DROP TABLE IF EXISTS \`team_members\``,
      `DROP TABLE IF EXISTS \`task_dependencies\``,
      `DROP TABLE IF EXISTS \`task_required_skills\``,
      `DROP TABLE IF EXISTS \`user_skills\``,
      `DROP TABLE IF EXISTS \`skills\``,
      `DROP TABLE IF EXISTS \`policies\``,
      `DROP TABLE IF EXISTS \`repositories\``,
      `DROP TABLE IF EXISTS \`tasks\``,
      `DROP TABLE IF EXISTS \`milestones\``,
      `DROP TABLE IF EXISTS \`teams\``,
      `DROP TABLE IF EXISTS \`projects\``,
      `DROP TABLE IF EXISTS \`users\``,
      `DROP TABLE IF EXISTS \`organizations\``,
    ];

    for (const sql of drops) {
      await queryRunner.query(sql);
    }
  }
}
