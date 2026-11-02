import {
  PermissionCategory,
  PermissionDefinition,
  PermissionKey,
  RoleDefinition,
  User,
  UserPermissionOverride,
} from "../types";

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // User Management
  {
    key: "user.view",
    label: "View Users",
    category: "user_management",
    description: "Browse organization directory and inspect user profiles.",
  },
  {
    key: "user.create",
    label: "Create Users",
    category: "user_management",
    description: "Provision new accounts and generate temporary login credentials.",
  },
  {
    key: "user.edit",
    label: "Edit Users",
    category: "user_management",
    description: "Modify member profile information, team, or department.",
  },
  {
    key: "user.deactivate",
    label: "Deactivate Accounts",
    category: "user_management",
    description: "Suspend or reactivate user login privileges.",
  },
  {
    key: "user.assign_role",
    label: "Assign Roles",
    category: "user_management",
    description: "Change the designated system or custom role for users.",
  },
  {
    key: "user.reset_password",
    label: "Reset Passwords",
    category: "user_management",
    description: "Issue temporary credentials or force password resets.",
  },

  // Project Management
  {
    key: "project.view",
    label: "View Projects",
    category: "project_management",
    description: "Access projects and inspect project milestones.",
  },
  {
    key: "project.create",
    label: "Create Projects",
    category: "project_management",
    description: "Launch new initiatives and configure technical scopes.",
  },
  {
    key: "project.edit",
    label: "Edit Projects",
    category: "project_management",
    description: "Modify project metadata, deadlines, repositories, and status.",
  },
  {
    key: "project.delete",
    label: "Archive / Delete Projects",
    category: "project_management",
    description: "Permanently delete or archive existing projects.",
  },
  {
    key: "project.assign_pm",
    label: "Assign Project Managers",
    category: "project_management",
    description: "Designate lead Project Managers for projects.",
  },
  {
    key: "project.manage_members",
    label: "Manage Project Members",
    category: "project_management",
    description: "Add or remove team members from project rosters.",
  },

  // Task Management
  {
    key: "task.view",
    label: "View Tasks",
    category: "task_management",
    description: "Inspect task cards, acceptance criteria, and discussions.",
  },
  {
    key: "task.create",
    label: "Create Tasks",
    category: "task_management",
    description: "Create new work items and requirements on boards.",
  },
  {
    key: "task.assign",
    label: "Assign Tasks",
    category: "task_management",
    description: "Allocate tasks to developers or reassign ownership.",
  },
  {
    key: "task.edit",
    label: "Edit Tasks",
    category: "task_management",
    description: "Update task descriptions, tags, and acceptance criteria.",
  },
  {
    key: "task.delete",
    label: "Delete Tasks",
    category: "task_management",
    description: "Remove obsolete or duplicate task cards.",
  },
  {
    key: "task.change_status",
    label: "Change Task Status",
    category: "task_management",
    description: "Move tasks between workflow stages on Kanban boards.",
  },
  {
    key: "task.manage_deadlines",
    label: "Manage Deadlines",
    category: "task_management",
    description: "Reschedule due dates and prioritize critical delivery targets.",
  },

  // Team Management
  {
    key: "team.view",
    label: "View Teams",
    category: "team_management",
    description: "Inspect organizational departments, teams, and member counts.",
  },
  {
    key: "team.create",
    label: "Create Teams",
    category: "team_management",
    description: "Form new functional teams or departments.",
  },
  {
    key: "team.edit",
    label: "Edit Teams",
    category: "team_management",
    description: "Rename teams, assign team leads, and alter descriptions.",
  },
  {
    key: "team.assign_members",
    label: "Assign Team Members",
    category: "team_management",
    description: "Move employees across teams and adjust allocations.",
  },

  // Reports
  {
    key: "reports.view_org",
    label: "View Org Reports",
    category: "reports",
    description: "Access executive analytics, company-wide delivery metrics.",
  },
  {
    key: "reports.view_project",
    label: "View Project Reports",
    category: "reports",
    description: "Inspect individual project velocity and completion charts.",
  },
  {
    key: "reports.export",
    label: "Export Reports",
    category: "reports",
    description: "Download CSV / PDF audit summaries and analytics.",
  },

  // Workspace Administration
  {
    key: "admin.manage_roles",
    label: "Manage Custom Roles",
    category: "workspace_administration",
    description: "Define, rename, and configure custom role privileges.",
  },
  {
    key: "admin.manage_permissions",
    label: "Manage Permissions Matrix",
    category: "workspace_administration",
    description: "Configure system matrix and apply individual overrides.",
  },
  {
    key: "admin.view_audit",
    label: "View Audit Logs",
    category: "workspace_administration",
    description: "Review security logs, administrative events, and change history.",
  },
  {
    key: "admin.settings",
    label: "Workspace Settings",
    category: "workspace_administration",
    description: "Manage global organization policies and environment rules.",
  },
];

export const PERMISSION_CATEGORIES: { id: PermissionCategory; label: string }[] = [
  { id: "user_management", label: "User Management" },
  { id: "project_management", label: "Project Management" },
  { id: "task_management", label: "Task Management" },
  { id: "team_management", label: "Team Management" },
  { id: "reports", label: "Reports & Analytics" },
  { id: "workspace_administration", label: "Workspace Administration" },
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "ADMIN",
    name: "Administrator",
    description: "Full organization-wide authority and security control center.",
    isSystem: true,
    permissions: ALL_PERMISSIONS.map((p) => p.key),
  },
  {
    id: "PROJECT_MANAGER",
    name: "Project Manager",
    description: "Oversees project delivery, developer assignment, and quality reviews.",
    isSystem: true,
    permissions: [
      "user.view",
      "project.view",
      "project.create",
      "project.edit",
      "project.manage_members",
      "task.view",
      "task.create",
      "task.assign",
      "task.edit",
      "task.delete",
      "task.change_status",
      "task.manage_deadlines",
      "team.view",
      "reports.view_project",
      "reports.export",
    ],
  },
  {
    id: "DEVELOPER",
    name: "Developer",
    description: "Focuses on assigned tasks, personal Kanban flow, and code delivery.",
    isSystem: true,
    permissions: [
      "user.view",
      "project.view",
      "task.view",
      "task.change_status",
      "team.view",
      "reports.view_project",
    ],
  },
  {
    id: "SENIOR_DEVELOPER",
    name: "Senior Developer",
    description: "Developer with elevated privileges to create tasks, review work, and guide peers.",
    isSystem: false,
    permissions: [
      "user.view",
      "project.view",
      "task.view",
      "task.create",
      "task.edit",
      "task.change_status",
      "team.view",
      "reports.view_project",
    ],
  },
];

const ROLES_STORAGE_KEY = "nexus_roles_definitions_v1";
const OVERRIDES_STORAGE_KEY = "nexus_user_overrides_v1";

export function getRoles(): RoleDefinition[] {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
      return DEFAULT_ROLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: RoleDefinition[]): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch (err) {
    console.error("Failed to save roles to storage", err);
  }
}

export function getUserOverrides(): Record<number, UserPermissionOverride> {
  try {
    const raw = localStorage.getItem(OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserOverride(override: UserPermissionOverride): void {
  try {
    const all = getUserOverrides();
    all[override.userId] = override;
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to save user override", err);
  }
}

export function removeUserOverride(userId: number): void {
  try {
    const all = getUserOverrides();
    delete all[userId];
    localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Failed to remove user override", err);
  }
}

export function resetRolesToDefault(): RoleDefinition[] {
  localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(DEFAULT_ROLES));
  return DEFAULT_ROLES;
}

/**
 * Centralized Permission Check Function
 * Evaluates role permissions + individual user overrides + optional contextual scope
 */
export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey,
  scope?: {
    projectId?: number;
    managedProjectIds?: number[];
    assigneeId?: number;
  }
): boolean {
  if (!user) return false;

  const role = (user.role || "").toUpperCase();

  // Master Admin has universal access
  if (role === "ADMIN") return true;

  // Check individual overrides first
  const overrides = getUserOverrides();
  const userOverride = overrides[user.id];
  if (userOverride) {
    if (userOverride.revoked.includes(permission)) return false;
    if (userOverride.granted.includes(permission)) {
      return checkScope(user, permission, scope);
    }
  }

  // Check role permissions (either custom or system)
  const roles = getRoles();
  const normalizedRoleId =
    role === "MANAGER" || role === "PROJECT_MANAGER"
      ? "PROJECT_MANAGER"
      : user.customRoleId || role;

  const roleDef = roles.find(
    (r) => r.id.toUpperCase() === normalizedRoleId.toUpperCase()
  );

  const hasRolePerm = roleDef ? roleDef.permissions.includes(permission) : false;
  if (!hasRolePerm) return false;

  return checkScope(user, permission, scope);
}

function checkScope(
  user: User,
  permission: PermissionKey,
  scope?: {
    projectId?: number;
    managedProjectIds?: number[];
    assigneeId?: number;
  }
): boolean {
  if (!scope) return true;

  const role = (user.role || "").toUpperCase();
  const isPM = role === "MANAGER" || role === "PROJECT_MANAGER";
  const isDev = role === "DEVELOPER";

  // PM scope check: if editing or managing a project, check if PM manages it
  if (
    isPM &&
    scope.projectId &&
    scope.managedProjectIds &&
    scope.managedProjectIds.length > 0
  ) {
    if (
      ["project.edit", "project.delete", "project.manage_members"].includes(
        permission
      )
    ) {
      return scope.managedProjectIds.includes(scope.projectId);
    }
  }

  // Developer scope check: if changing status or editing, must be assigned to them
  if (isDev && scope.assigneeId !== undefined) {
    if (["task.change_status", "task.edit"].includes(permission)) {
      return scope.assigneeId === user.id;
    }
  }

  return true;
}
