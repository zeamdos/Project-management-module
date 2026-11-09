# Database Design - Project Management Module

## Overview
This document outlines the database schema for the Project Management Module based on the SRS requirements. The database will be implemented using MySQL with TypeORM.

## Database Schema

### 1. Organization
**Description**: Top-level entity representing a company or organization
**Table**: `organization`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Organization name |
| settings | JSON | NULL | Organization-specific settings |
| plan | VARCHAR(50) | NULL | Subscription plan (e.g., 'free', 'pro', 'enterprise') |
| default_language | VARCHAR(10) | DEFAULT 'en' | Default language for organization (e.g., 'en', 'am', 'es') |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (name)

---

### 2. User
**Description**: User accounts with roles and contact information
**Table**: `user`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| org_id | INT | FK, NOT NULL | Reference to organization |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| role | ENUM | NOT NULL | Role: 'admin', 'manager', 'team_lead', 'reviewer', 'developer', 'executive' |
| specialty | VARCHAR(100) | NULL | Specialization (e.g., 'frontend', 'backend', 'ui_ux', 'ai') |
| phone | VARCHAR(20) | NULL | Phone number for SMS |
| telegram_id | VARCHAR(100) | NULL | Telegram user ID |
| github_username | VARCHAR(100) | NULL | GitHub username |
| github_token | VARCHAR(255) | NULL | Encrypted GitHub token |
| timezone | VARCHAR(50) | NULL | User's timezone |
| language | VARCHAR(10) | DEFAULT 'en' | User's preferred language (e.g., 'en', 'am', 'es') |
| status | ENUM | NOT NULL, DEFAULT 'active' | Status: 'active', 'inactive', 'suspended' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (email)
- INDEX (org_id)
- INDEX (role)
- INDEX (status)
- INDEX (github_username)
- INDEX (telegram_id)

**Foreign Keys**:
- org_id → organization(id)

---

### 3. Project
**Description**: Projects with goals, milestones, and deadlines
**Table**: `project`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| org_id | INT | FK, NOT NULL | Reference to organization |
| title | VARCHAR(255) | NOT NULL | Project title |
| description | TEXT | NULL | Detailed description |
| goals | TEXT | NULL | Project goals |
| tech_stack | JSON | NULL | Technology stack information |
| start_date | DATE | NULL | Project start date |
| deadline | DATE | NULL | Project deadline |
| update_interval_days | INT | DEFAULT 7 | Progress update cycle in days |
| status | ENUM | NOT NULL, DEFAULT 'planning' | Status: 'planning', 'active', 'on_hold', 'completed', 'cancelled' |
| health | ENUM | DEFAULT 'on_track' | Health: 'on_track', 'at_risk', 'critical' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (org_id)
- INDEX (status)
- INDEX (health)
- INDEX (deadline)

**Foreign Keys**:
- org_id → organization(id)

---

### 4. Milestone
**Description**: Project milestones with deadlines
**Table**: `milestone`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INT | FK, NOT NULL | Reference to project |
| title | VARCHAR(255) | NOT NULL | Milestone title |
| description | TEXT | NULL | Milestone description |
| deadline | DATE | NOT NULL | Milestone deadline |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Status: 'pending', 'in_progress', 'completed', 'delayed' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (project_id)
- INDEX (status)
- INDEX (deadline)

**Foreign Keys**:
- project_id → project(id) ON DELETE CASCADE

---

### 5. Team
**Description**: Teams within projects (Frontend, Backend, UI/UX, AI)
**Table**: `team`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INT | FK, NOT NULL | Reference to project |
| name | VARCHAR(100) | NOT NULL | Team name |
| type | ENUM | NOT NULL | Type: 'frontend', 'backend', 'ui_ux', 'ai' |
| lead_id | INT | FK, NULL | Team lead reference |
| deadline | DATE | NULL | Team deadline |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (project_id)
- INDEX (type)
- INDEX (lead_id)

**Foreign Keys**:
- project_id → project(id) ON DELETE CASCADE
- lead_id → user(id)

---

### 6. TeamMember
**Description**: Many-to-many relationship between teams and users
**Table**: `team_member`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| team_id | INT | FK, NOT NULL | Reference to team |
| user_id | INT | FK, NOT NULL | Reference to user |
| role | VARCHAR(50) | NOT NULL | Role within team (e.g., 'member', 'lead') |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Join timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (team_id, user_id)
- INDEX (user_id)

**Foreign Keys**:
- team_id → team(id) ON DELETE CASCADE
- user_id → user(id) ON DELETE CASCADE

---

### 7. Skill
**Description**: Catalog of skills that can be assigned to users
**Table**: `skill`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Skill name |
| specialty | VARCHAR(50) | NULL | Specialty category (e.g., 'frontend', 'backend') |
| status | ENUM | NOT NULL, DEFAULT 'active' | Status: 'active', 'inactive' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (name)
- INDEX (specialty)
- INDEX (status)

---

### 8. UserSkill
**Description**: Skills that users have declared with proficiency levels
**Table**: `user_skill`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FK, NOT NULL | Reference to user |
| skill_id | INT | FK, NOT NULL | Reference to skill |
| proficiency | ENUM | NOT NULL | Proficiency: 'beginner', 'intermediate', 'advanced', 'expert' |
| years_experience | INT | NULL | Years of experience |
| confirmed_by | INT | FK, NULL | User who confirmed this skill |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (user_id, skill_id)
- INDEX (skill_id)
- INDEX (proficiency)

**Foreign Keys**:
- user_id → user(id) ON DELETE CASCADE
- skill_id → skill(id)
- confirmed_by → user(id)

---

### 9. TaskRequiredSkill
**Description**: Skills required for a task
**Table**: `task_required_skill`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| task_id | INT | FK, NOT NULL | Reference to task |
| skill_id | INT | FK, NOT NULL | Reference to skill |
| minimum_proficiency | ENUM | NOT NULL | Minimum proficiency required |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (task_id, skill_id)
- INDEX (skill_id)

**Foreign Keys**:
- task_id → task(id) ON DELETE CASCADE
- skill_id → skill(id)

---

### 10. Task
**Description**: Individual tasks within projects
**Table**: `task`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INT | FK, NOT NULL | Reference to project |
| team_id | INT | FK, NULL | Reference to team |
| assignee_id | INT | FK, NULL | Reference to assigned user |
| parent_id | INT | FK, NULL | Parent task for subtasks |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | NULL | Task description |
| acceptance_criteria | TEXT | NULL | Acceptance criteria |
| priority | ENUM | NOT NULL, DEFAULT 'medium' | Priority: 'low', 'medium', 'high', 'critical' |
| estimate_hours | DECIMAL(5,2) | NULL | Estimated hours |
| status | ENUM | NOT NULL, DEFAULT 'todo' | Status: 'todo', 'in_progress', 'in_review', 'done', 'blocked' |
| deadline | DATE | NULL | Task deadline |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (project_id)
- INDEX (team_id)
- INDEX (assignee_id)
- INDEX (parent_id)
- INDEX (status)
- INDEX (priority)
- INDEX (deadline)

**Foreign Keys**:
- project_id → project(id) ON DELETE CASCADE
- team_id → team(id) ON DELETE SET NULL
- assignee_id → user(id) ON DELETE SET NULL
- parent_id → task(id) ON DELETE SET NULL

---

### 11. TaskDependency
**Description**: Dependencies between tasks
**Table**: `task_dependency`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| task_id | INT | FK, NOT NULL | Task that depends |
| depends_on_task_id | INT | FK, NOT NULL | Task that is depended upon |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE INDEX (task_id, depends_on_task_id)
- INDEX (depends_on_task_id)

**Foreign Keys**:
- task_id → task(id) ON DELETE CASCADE
- depends_on_task_id → task(id) ON DELETE CASCADE

---

### 12. Repository
**Description**: Git repositories linked to projects
**Table**: `repository`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| project_id | INT | FK, NOT NULL | Reference to project |
| provider | VARCHAR(50) | NOT NULL | Git provider (e.g., 'github') |
| repo_name | VARCHAR(255) | NOT NULL | Repository name (e.g., 'owner/repo') |
| repo_url | VARCHAR(500) | NOT NULL | Repository URL |
| webhook_secret | VARCHAR(255) | NULL | Webhook secret for verification |
| last_synced_at | TIMESTAMP | NULL | Last sync timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (project_id)
- UNIQUE INDEX (provider, repo_name)

**Foreign Keys**:
- project_id → project(id) ON DELETE CASCADE

---

### 13. GitActivity
**Description**: GitHub activity linked to tasks (commits, PRs, reviews)
**Table**: `git_activity`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| repo_id | INT | FK, NOT NULL | Reference to repository |
| user_id | INT | FK, NULL | Reference to user |
| task_id | INT | FK, NULL | Reference to task |
| type | ENUM | NOT NULL | Type: 'commit', 'pull_request', 'review' |
| reference | VARCHAR(255) | NOT NULL | Reference (commit SHA, PR number, etc.) |
| status | VARCHAR(50) | NULL | Status (e.g., 'open', 'merged', 'closed') |
| metadata | JSON | NULL | Additional activity data |
| timestamp | TIMESTAMP | NOT NULL | Activity timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (repo_id)
- INDEX (user_id)
- INDEX (task_id)
- INDEX (type)
- INDEX (timestamp)

**Foreign Keys**:
- repo_id → repository(id) ON DELETE CASCADE
- user_id → user(id) ON DELETE SET NULL
- task_id → task(id) ON DELETE SET NULL

---

### 14. Review
**Description**: Code reviews for pull requests or tasks
**Table**: `review`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| pr_or_task_id | INT | FK, NOT NULL | Reference to PR or task |
| reviewer_id | INT | FK, NOT NULL | Reference to reviewer |
| decision | ENUM | NULL | Decision: 'approved', 'changes_requested', 'rejected' |
| comment | TEXT | NULL | Review comments |
| review_date | TIMESTAMP | NULL | Review timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (pr_or_task_id)
- INDEX (reviewer_id)
- INDEX (decision)

**Foreign Keys**:
- reviewer_id → user(id)

---

### 15. ProgressUpdate
**Description**: Developer progress updates
**Table**: `progress_update`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FK, NOT NULL | Reference to user |
| project_id | INT | FK, NOT NULL | Reference to project |
| cycle | INT | NOT NULL | Update cycle number |
| work_done | TEXT | NULL | Work completed |
| next_steps | TEXT | NULL | Planned next steps |
| blockers | TEXT | NULL | Any blockers reported |
| confidence | ENUM | NOT NULL | Confidence level: 'low', 'medium', 'high' |
| update_date | TIMESTAMP | NOT NULL | Update timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (project_id)
- INDEX (cycle)
- INDEX (update_date)

**Foreign Keys**:
- user_id → user(id) ON DELETE CASCADE
- project_id → project(id) ON DELETE CASCADE

---

### 16. Notification
**Description**: Notifications sent to users
**Table**: `notification`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| user_id | INT | FK, NOT NULL | Reference to user |
| type | VARCHAR(50) | NOT NULL | Notification type |
| channel | ENUM | NOT NULL | Channel: 'telegram', 'sms', 'email', 'in_app' |
| template | VARCHAR(100) | NULL | Template used |
| content | TEXT | NULL | Notification content |
| status | ENUM | NOT NULL, DEFAULT 'pending' | Status: 'pending', 'sent', 'delivered', 'failed' |
| attempts | INT | DEFAULT 0 | Number of delivery attempts |
| sent_at | TIMESTAMP | NULL | Sent timestamp |
| delivered_at | TIMESTAMP | NULL | Delivered timestamp |
| error_message | TEXT | NULL | Error message if failed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (status)
- INDEX (channel)
- INDEX (created_at)

**Foreign Keys**:
- user_id → user(id) ON DELETE CASCADE

---

### 17. EscalationRule
**Description**: Escalation rules for missed deadlines or updates
**Table**: `escalation_rule`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| org_id | INT | FK, NOT NULL | Reference to organization |
| scope | VARCHAR(50) | NOT NULL | Scope: 'project', 'task', 'update' |
| trigger | VARCHAR(100) | NOT NULL | Trigger condition |
| offset_hours | INT | NOT NULL | Hours after trigger to escalate |
| target_role | VARCHAR(50) | NULL | Target role for escalation |
| channel | ENUM | NOT NULL | Channel: 'telegram', 'sms', 'email' |
| is_active | BOOLEAN | DEFAULT TRUE | Whether rule is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (org_id)
- INDEX (scope)
- INDEX (is_active)

**Foreign Keys**:
- org_id → organization(id) ON DELETE CASCADE

---

### 18. Policy
**Description**: Organizational policies
**Table**: `policy`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique identifier |
| org_id | INT | FK, NOT NULL | Reference to organization |
| name | VARCHAR(100) | NOT NULL | Policy name |
| description | TEXT | NULL | Policy description |
| config | JSON | NOT NULL | Policy configuration |
| is_active | BOOLEAN | DEFAULT TRUE | Whether policy is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Last update timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (org_id)
- UNIQUE INDEX (org_id, name)
- INDEX (is_active)

**Foreign Keys**:
- org_id → organization(id) ON DELETE CASCADE

---

### 19. AuditLog
**Description**: Audit trail for all actions
**Table**: `audit_log`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Unique identifier |
| org_id | INT | FK, NOT NULL | Reference to organization |
| actor_id | INT | FK, NOT NULL | Reference to user who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity affected |
| entity_id | INT | NOT NULL | ID of entity affected |
| before_value | JSON | NULL | Value before change |
| after_value | JSON | NULL | Value after change |
| ip_address | VARCHAR(45) | NULL | IP address of actor |
| timestamp | TIMESTAMP | NOT NULL | Action timestamp |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (org_id)
- INDEX (actor_id)
- INDEX (entity_type, entity_id)
- INDEX (timestamp)

**Foreign Keys**:
- org_id → organization(id) ON DELETE CASCADE
- actor_id → user(id) ON DELETE SET NULL

---

## Entity Relationship Diagram (ERD)

```
organization (1) ----< (N) user
organization (1) ----< (N) project
organization (1) ----< (N) escalation_rule
organization (1) ----< (N) policy
organization (1) ----< (N) audit_log

user (1) ----< (N) team_member
user (1) ----< (N) user_skill
user (1) ----< (N) task (as assignee)
user (1) ----< (N) git_activity
user (1) ----< (N) review (as reviewer)
user (1) ----< (N) progress_update
user (1) ----< (N) notification
user (1) ----< (N) audit_log (as actor)
user (1) ----< (N) team (as lead)

project (1) ----< (N) milestone
project (1) ----< (N) team
project (1) ----< (N) task
project (1) ----< (N) repository
project (1) ----< (N) progress_update

team (1) ----< (N) team_member
team (1) ----< (N) task

skill (1) ----< (N) user_skill
skill (1) ----< (N) task_required_skill

task (1) ----< (N) task_dependency (self-referencing)
task (1) ----< (N) task_required_skill
task (1) ----< (N) git_activity
task (1) ----< (N) review

repository (1) ----< (N) git_activity
```

## Database Constraints and Rules

### Referential Integrity
- All foreign key relationships enforce referential integrity
- ON DELETE CASCADE used for dependent entities
- ON DELETE SET NULL used for optional relationships

### Data Validation
- ENUM types restrict values to valid options
- NOT NULL constraints ensure required fields
- UNIQUE constraints prevent duplicates
- CHECK constraints can be added for custom validation

### Performance Considerations
- Indexes on foreign keys for faster joins
- Indexes on frequently queried columns (status, deadline, etc.)
- Composite indexes for common query patterns
- Timestamps for time-based queries

### Security
- Passwords stored as hashes (bcrypt)
- GitHub tokens encrypted at rest
- Audit log captures all changes
- Role-based access enforced at application level

## Data Retention

Based on the SRS requirements:
- Activity data: Configurable retention period (default: 1 year)
- Notifications: Configurable retention period (default: 6 months)
- Audit logs: Configurable retention period (default: 2 years)
- Personal data: Can be exported, anonymized, or deleted on request

## Backup Strategy

- Daily full backups
- Continuous incremental backups
- Backups tested periodically
- Recovery Point Objective (RPO): 15 minutes
- Recovery Time Objective (RTO): 4 hours

## Next Steps

1. Review and approve this database design
2. Generate TypeORM entity files
3. Create database migration scripts
4. Set up the MySQL database
5. Implement backend API with Express.js
