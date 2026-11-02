export type UserRole = "ADMIN" | "MANAGER" | "PROJECT_MANAGER" | "DEVELOPER" | "TEAM_LEAD" | string;

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: number;
  orgId?: number;
  name: string;
  email: string;
  role: UserRole;
  customRoleId?: string;
  department?: string;
  team?: string;
  specialty?: string;
  assignedPmId?: number;
  status: UserStatus;
  isTemporaryPassword?: boolean;
  avatar?: string;
  githubUsername?: string | null;
  phoneNumber?: string | null;
  telegramLinked?: boolean;
  notifyInApp?: boolean;
  notifyTelegram?: boolean;
  notifyEmail?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt?: string;
}

export type PermissionCategory =
  | "user_management"
  | "project_management"
  | "task_management"
  | "team_management"
  | "reports"
  | "workspace_administration";

export type PermissionKey =
  // User management
  | "user.view"
  | "user.create"
  | "user.edit"
  | "user.deactivate"
  | "user.assign_role"
  | "user.reset_password"
  // Project management
  | "project.view"
  | "project.create"
  | "project.edit"
  | "project.delete"
  | "project.assign_pm"
  | "project.manage_members"
  // Task management
  | "task.view"
  | "task.create"
  | "task.assign"
  | "task.edit"
  | "task.delete"
  | "task.change_status"
  | "task.manage_deadlines"
  // Team management
  | "team.view"
  | "team.create"
  | "team.edit"
  | "team.assign_members"
  // Reports
  | "reports.view_org"
  | "reports.view_project"
  | "reports.export"
  // Workspace administration
  | "admin.manage_roles"
  | "admin.manage_permissions"
  | "admin.view_audit"
  | "admin.settings";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: PermissionCategory;
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean; // ADMIN, PM, DEVELOPER cannot be deleted
  permissions: PermissionKey[];
}

export interface UserPermissionOverride {
  userId: number;
  granted: PermissionKey[];
  revoked: PermissionKey[];
}

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface TaskComment {
  id: string;
  taskId: number;
  authorId: number;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface TaskBlocker {
  id: string;
  taskId: number;
  reporterId: number;
  reporterName: string;
  description: string;
  resolved: boolean;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: number;
  actorId: number;
  actorName: string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  projectName?: string;
  teamId?: number | null;
  teamName?: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  requiredRole?: string;
  requiredSkill?: string;
  assigneeId?: number | null;
  assignee?: {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    specialty?: string;
  } | null;
  createdById?: number;
  createdByName?: string;
  startDate?: string;
  dueDate?: string;
  labels?: string[];
  githubPrUrl?: string;
  githubRepoUrl?: string;
  comments?: TaskComment[];
  blocker?: TaskBlocker | null;
  activity?: TaskActivity[];
  updatedAt?: string;
  createdAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  health?: "ON_TRACK" | "AT_RISK" | "CRITICAL";
  pmId?: number;
  pmName?: string;
  teamIds?: number[];
  memberIds?: number[];
  tasks?: Task[];
  deadline?: string;
  startDate?: string;
  techStack?: string;
  repoUrl?: string;
  updateIntervalDays?: number;
  createdAt?: string;
}

export interface Team {
  id: number;
  name: string;
  department: string;
  leadId?: number;
  leadName?: string;
  memberIds: number[];
  description?: string;
}

export interface AuditLogItem {
  id: string | number;
  timestamp: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | number;
  details: string;
  ipAddress?: string;
}

export interface NotificationItem {
  id: string | number;
  userId: number;
  title: string;
  message: string;
  kind: "ALERT" | "BLOCKER" | "REVIEW" | "TASK" | "SYSTEM" | "PROGRESS";
  readAt: string | null;
  link?: string;
  createdAt: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "MILESTONE" | "DEADLINE" | "RELEASE" | "REVIEW" | "EVENT";
  projectId?: number;
  projectName?: string;
  assigneeId?: number;
  isOrganizationWide: boolean;
  description?: string;
}
