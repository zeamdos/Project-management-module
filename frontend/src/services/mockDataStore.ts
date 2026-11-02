import {
  AuditLogItem,
  NotificationItem,
  PlannerEvent,
  Project,
  Task,
  TaskBlocker,
  TaskComment,
  Team,
  User,
} from "../types";

const USERS_KEY = "nexus_users_store_v1";
const TEAMS_KEY = "nexus_teams_store_v1";
const TASKS_KEY = "nexus_tasks_store_v1";
const AUDIT_KEY = "nexus_audit_logs_v1";
const NOTIFS_KEY = "nexus_notifications_v1";
const PLANNER_KEY = "nexus_planner_events_v1";

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    orgId: 1,
    name: "Master Admin",
    email: "admin@enterprise.com",
    role: "ADMIN",
    department: "Executive",
    team: "Organization Leadership",
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "MA",
    githubUsername: "nexus-admin",
    phoneNumber: "+251911000000",
    telegramLinked: true,
    notifyInApp: true,
    notifyTelegram: true,
    notifyEmail: true,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: 2,
    orgId: 1,
    name: "Sarah Jenkins",
    email: "pm@enterprise.com",
    role: "PROJECT_MANAGER",
    department: "Engineering Management",
    team: "Core Platform",
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "SJ",
    githubUsername: "sarahj-pm",
    phoneNumber: "+251911223344",
    telegramLinked: true,
    notifyInApp: true,
    notifyTelegram: true,
    notifyEmail: true,
    createdAt: "2026-10-05T09:30:00Z",
  },
  {
    id: 3,
    orgId: 1,
    name: "Michael Chen",
    email: "michael.chen@enterprise.com",
    role: "PROJECT_MANAGER",
    department: "Product Engineering",
    team: "Client Applications",
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "MC",
    githubUsername: "mchen-lead",
    phoneNumber: "+251911334455",
    telegramLinked: false,
    notifyInApp: true,
    notifyTelegram: false,
    notifyEmail: true,
    createdAt: "2026-10-08T10:15:00Z",
  },
  {
    id: 4,
    orgId: 1,
    name: "Alex Mercer",
    email: "alex.mercer@enterprise.com",
    role: "DEVELOPER",
    specialty: "Frontend",
    department: "Engineering",
    team: "Frontend Engineering",
    assignedPmId: 2,
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "AM",
    githubUsername: "alexmercer-dev",
    phoneNumber: "+251911445566",
    telegramLinked: true,
    notifyInApp: true,
    notifyTelegram: true,
    notifyEmail: true,
    createdAt: "2026-10-12T11:00:00Z",
  },
  {
    id: 5,
    orgId: 1,
    name: "David Kim",
    email: "david.kim@enterprise.com",
    role: "DEVELOPER",
    specialty: "Backend",
    department: "Engineering",
    team: "Backend Infrastructure",
    assignedPmId: 2,
    status: "ACTIVE",
    isTemporaryPassword: true, // Needs password change on first login test
    avatar: "DK",
    githubUsername: "dkim-backend",
    phoneNumber: "+251911556677",
    telegramLinked: false,
    notifyInApp: true,
    notifyTelegram: false,
    notifyEmail: true,
    createdAt: "2026-10-14T14:20:00Z",
  },
  {
    id: 6,
    orgId: 1,
    name: "Elena Rostova",
    email: "elena.rostova@enterprise.com",
    role: "DEVELOPER",
    customRoleId: "SENIOR_DEVELOPER",
    specialty: "UI/UX",
    department: "Product Design",
    team: "UI/UX Design Systems",
    assignedPmId: 3,
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "ER",
    githubUsername: "elenar-design",
    phoneNumber: "+251911667788",
    telegramLinked: true,
    notifyInApp: true,
    notifyTelegram: true,
    notifyEmail: false,
    createdAt: "2026-10-18T08:45:00Z",
  },
  {
    id: 7,
    orgId: 1,
    name: "Marcus Vance",
    email: "marcus.vance@enterprise.com",
    role: "DEVELOPER",
    specialty: "AI",
    department: "Applied AI",
    team: "Machine Learning Solutions",
    assignedPmId: 2,
    status: "ACTIVE",
    isTemporaryPassword: false,
    avatar: "MV",
    githubUsername: "marcusv-ai",
    phoneNumber: "+251911778899",
    telegramLinked: false,
    notifyInApp: true,
    notifyTelegram: false,
    notifyEmail: true,
    createdAt: "2026-10-20T16:00:00Z",
  },
  {
    id: 8,
    orgId: 1,
    name: "Tariq Haile",
    email: "tariq.haile@enterprise.com",
    role: "DEVELOPER",
    specialty: "Frontend",
    department: "Engineering",
    team: "Frontend Engineering",
    assignedPmId: 3,
    status: "INACTIVE", // For showing deactivated account management
    isTemporaryPassword: false,
    avatar: "TH",
    githubUsername: "tariqh-code",
    phoneNumber: "+251911889900",
    telegramLinked: false,
    notifyInApp: false,
    notifyTelegram: false,
    notifyEmail: false,
    createdAt: "2026-10-22T09:10:00Z",
  },
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 1,
    name: "Frontend Engineering",
    department: "Engineering",
    leadId: 4,
    leadName: "Alex Mercer",
    memberIds: [4, 8],
    description: "Component architecture, interactive widgets, responsive performance, state machines.",
  },
  {
    id: 2,
    name: "Backend Infrastructure",
    department: "Engineering",
    leadId: 5,
    leadName: "David Kim",
    memberIds: [5],
    description: "Distributed APIs, database schemas, secure transactions, event queues.",
  },
  {
    id: 3,
    name: "UI/UX Design Systems",
    department: "Product Design",
    leadId: 6,
    leadName: "Elena Rostova",
    memberIds: [6],
    description: "Design tokens, accessible interaction models, dark ergonomics, UX flows.",
  },
  {
    id: 4,
    name: "Machine Learning Solutions",
    department: "Applied AI",
    leadId: 7,
    leadName: "Marcus Vance",
    memberIds: [7],
    description: "Automated task decomposition, predictive workload analysis, telemetry synthesis.",
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 101,
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    teamId: 1,
    teamName: "Frontend Engineering",
    title: "Implement Role-Based Workspace Shell and Navigation",
    description:
      "Deliver distinct navigation sidebars and workspace layouts tailored specifically for Admin, PM, and Developer personas.",
    acceptanceCriteria: [
      "Navigation switches seamlessly based on authenticated user role",
      "Full dark charcoal theme with neutral gray borders and clear hierarchy",
      "Admin has dedicated control center; PM has project workspace; Developer has personal view",
    ],
    status: "IN_PROGRESS",
    priority: "HIGH",
    requiredRole: "frontend",
    requiredSkill: "React, TypeScript, Tailwind",
    assigneeId: 4,
    assignee: {
      id: 4,
      name: "Alex Mercer",
      email: "alex.mercer@enterprise.com",
      avatar: "AM",
      specialty: "Frontend",
    },
    createdById: 2,
    createdByName: "Sarah Jenkins",
    startDate: "2026-11-01",
    dueDate: "2026-11-05",
    labels: ["frontend", "core-architecture", "security"],
    githubPrUrl: "https://github.com/enterprise/workspace/pull/42",
    githubRepoUrl: "https://github.com/enterprise/workspace",
    comments: [
      {
        id: "c-1",
        taskId: 101,
        authorId: 2,
        authorName: "Sarah Jenkins",
        authorRole: "Project Manager",
        content: "Alex, ensure the Admin matrix allows toggling individual user permission overrides directly.",
        createdAt: "2026-11-01T14:30:00Z",
      },
      {
        id: "c-2",
        taskId: 101,
        authorId: 4,
        authorName: "Alex Mercer",
        authorRole: "Developer",
        content: "Got it Sarah, matrix view with category grouping and instant override persistence is wired up.",
        createdAt: "2026-11-01T15:10:00Z",
      },
    ],
    activity: [
      {
        id: "a-1",
        taskId: 101,
        actorId: 2,
        actorName: "Sarah Jenkins",
        action: "Created task",
        details: "Assigned to Alex Mercer with High priority",
        createdAt: "2026-11-01T09:00:00Z",
      },
      {
        id: "a-2",
        taskId: 101,
        actorId: 4,
        actorName: "Alex Mercer",
        action: "Status changed",
        details: "Moved from TODO to IN_PROGRESS",
        createdAt: "2026-11-01T10:15:00Z",
      },
    ],
  },
  {
    id: 102,
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    teamId: 2,
    teamName: "Backend Infrastructure",
    title: "Secure Session Invalidation and Audit Log Dispatcher",
    description:
      "Record every sensitive administrative action, password reset, and role mutation in persistent audit logs.",
    acceptanceCriteria: [
      "Log actor id, timestamp, action name, target entity, and client IP",
      "Admin audit viewer with search and filtering by actor and date range",
    ],
    status: "IN_REVIEW",
    priority: "CRITICAL",
    requiredRole: "backend",
    requiredSkill: "Node.js, TypeORM, Security",
    assigneeId: 5,
    assignee: {
      id: 5,
      name: "David Kim",
      email: "david.kim@enterprise.com",
      avatar: "DK",
      specialty: "Backend",
    },
    createdById: 2,
    createdByName: "Sarah Jenkins",
    startDate: "2026-10-28",
    dueDate: "2026-11-04",
    labels: ["backend", "audit", "compliance"],
    githubPrUrl: "https://github.com/enterprise/backend/pull/88",
    comments: [
      {
        id: "c-3",
        taskId: 102,
        authorId: 5,
        authorName: "David Kim",
        authorRole: "Developer",
        content: "Submitted PR #88 for PM review. Audit log queries support multi-criteria filtering.",
        createdAt: "2026-11-02T10:00:00Z",
      },
    ],
    activity: [
      {
        id: "a-3",
        taskId: 102,
        actorId: 5,
        actorName: "David Kim",
        action: "Submitted for Review",
        details: "Work submitted to Sarah Jenkins for approval",
        createdAt: "2026-11-02T10:00:00Z",
      },
    ],
  },
  {
    id: 103,
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    teamId: 3,
    teamName: "UI/UX Design Systems",
    title: "Design System Dark Theme & Kanban Board Polish",
    description:
      "Craft high-contrast dark charcoal visual palette with smooth column transitions and clear status indicators.",
    acceptanceCriteria: [
      "Zero blinding blue or purple accents; use refined grayscale with soft badges",
      "Kanban board with Backlog, To Do, In Progress, In Review, Done columns",
      "Clear visual markers for blocked tasks and priority tags",
    ],
    status: "DONE",
    priority: "MEDIUM",
    requiredRole: "ui_ux",
    requiredSkill: "Figma, Tailwind, UI Design",
    assigneeId: 6,
    assignee: {
      id: 6,
      name: "Elena Rostova",
      email: "elena.rostova@enterprise.com",
      avatar: "ER",
      specialty: "UI/UX",
    },
    createdById: 2,
    createdByName: "Sarah Jenkins",
    startDate: "2026-10-25",
    dueDate: "2026-11-01",
    labels: ["design", "ui", "kanban"],
    comments: [
      {
        id: "c-4",
        taskId: 103,
        authorId: 2,
        authorName: "Sarah Jenkins",
        authorRole: "Project Manager",
        content: "Approved! The monochrome palette with subtle borders matches enterprise standards perfectly.",
        createdAt: "2026-11-01T16:00:00Z",
      },
    ],
    activity: [
      {
        id: "a-4",
        taskId: 103,
        actorId: 2,
        actorName: "Sarah Jenkins",
        action: "Review Approved",
        details: "Task marked as DONE",
        createdAt: "2026-11-01T16:00:00Z",
      },
    ],
  },
  {
    id: 104,
    projectId: 2,
    projectName: "AI Telemetry & Workflow Pipeline",
    teamId: 4,
    teamName: "Machine Learning Solutions",
    title: "Decompose Technical Scopes into Skill-Matched Tasks",
    description:
      "Connect automated AI task parsing to identify developer skills and recommend the best assignee.",
    acceptanceCriteria: [
      "Extract tasks with role tags (frontend, backend, ui/ux, ai)",
      "Provide confidence scoring and suggest assignees based on capacity",
    ],
    status: "TODO",
    priority: "HIGH",
    requiredRole: "ai",
    requiredSkill: "Python, AI heuristics, NLP",
    assigneeId: 7,
    assignee: {
      id: 7,
      name: "Marcus Vance",
      email: "marcus.vance@enterprise.com",
      avatar: "MV",
      specialty: "AI",
    },
    createdById: 3,
    createdByName: "Michael Chen",
    startDate: "2026-11-03",
    dueDate: "2026-11-10",
    labels: ["ai", "pipeline", "skills"],
    comments: [],
    activity: [],
  },
  {
    id: 105,
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    teamId: 1,
    teamName: "Frontend Engineering",
    title: "Multi-factor Authentication and Telegram Alert Integration",
    description:
      "Verify bot webhook dispatching when developers report blockers or PM submits reviews.",
    acceptanceCriteria: [
      "Generates deep link for Telegram bot pairing",
      "Immediate alert dispatch on critical blocker",
    ],
    status: "BLOCKED",
    priority: "CRITICAL",
    requiredRole: "frontend",
    requiredSkill: "Telegram API, WebSockets, Security",
    assigneeId: 4,
    assignee: {
      id: 4,
      name: "Alex Mercer",
      email: "alex.mercer@enterprise.com",
      avatar: "AM",
      specialty: "Frontend",
    },
    createdById: 2,
    createdByName: "Sarah Jenkins",
    startDate: "2026-10-30",
    dueDate: "2026-11-03",
    labels: ["telegram", "blocker", "notifications"],
    blocker: {
      id: "b-1",
      taskId: 105,
      reporterId: 4,
      reporterName: "Alex Mercer",
      description: "Waiting for Telegram bot token environment credentials to verify real-time webhook push.",
      resolved: false,
      createdAt: "2026-11-02T08:30:00Z",
    },
    comments: [
      {
        id: "c-5",
        taskId: 105,
        authorId: 4,
        authorName: "Alex Mercer",
        authorRole: "Developer",
        content: "Reported blocker: Telegram bot credentials need verification on staging proxy.",
        createdAt: "2026-11-02T08:30:00Z",
      },
      {
        id: "c-6",
        taskId: 105,
        authorId: 2,
        authorName: "Sarah Jenkins",
        authorRole: "Project Manager",
        content: "Investigating with DevOps. In the meantime, in-app notifications will buffer properly.",
        createdAt: "2026-11-02T09:15:00Z",
      },
    ],
    activity: [
      {
        id: "a-5",
        taskId: 105,
        actorId: 4,
        actorName: "Alex Mercer",
        action: "Reported Blocker",
        details: "Blocked on Telegram bot token credentials",
        createdAt: "2026-11-02T08:30:00Z",
      },
    ],
  },
  {
    id: 106,
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    teamId: 1,
    teamName: "Frontend Engineering",
    title: "Organization Planner & Milestone Calendar",
    description:
      "Interactive agenda and calendar views displaying organization milestones, project deadlines, and delivery timeline.",
    acceptanceCriteria: [
      "Role-aware view: Admin sees org-wide; PM sees project deadlines; Dev sees personal schedule",
      "Date filters and milestone creation",
    ],
    status: "BACKLOG",
    priority: "MEDIUM",
    requiredRole: "frontend",
    requiredSkill: "React, Date Math, UI",
    assigneeId: null,
    assignee: null,
    createdById: 2,
    createdByName: "Sarah Jenkins",
    startDate: "2026-11-06",
    dueDate: "2026-11-14",
    labels: ["planner", "calendar", "backlog"],
    comments: [],
    activity: [],
  },
  {
    id: 107,
    projectId: 2,
    projectName: "AI Telemetry & Workflow Pipeline",
    teamId: 2,
    teamName: "Backend Infrastructure",
    title: "Repository Webhook Event Handler",
    description: "Parse incoming GitHub push and pull-request payloads with cryptographic HMAC verification.",
    acceptanceCriteria: [
      "Verify sha256 signatures",
      "Link commits to active task id via message regex",
    ],
    status: "BACKLOG",
    priority: "LOW",
    requiredRole: "backend",
    requiredSkill: "Node.js, Cryptography, GitHub API",
    assigneeId: 5,
    assignee: {
      id: 5,
      name: "David Kim",
      email: "david.kim@enterprise.com",
      avatar: "DK",
      specialty: "Backend",
    },
    createdById: 3,
    createdByName: "Michael Chen",
    startDate: "2026-11-08",
    dueDate: "2026-11-16",
    labels: ["github", "webhooks"],
    comments: [],
    activity: [],
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud-1",
    timestamp: "2026-11-02T13:45:00Z",
    actorId: 1,
    actorName: "Master Admin",
    actorRole: "ADMIN",
    action: "ROLE_PERMISSION_UPDATED",
    entityType: "Role",
    entityId: "SENIOR_DEVELOPER",
    details: "Granted 'task.create' and 'task.edit' permissions to custom role Senior Developer",
    ipAddress: "192.168.1.10",
  },
  {
    id: "aud-2",
    timestamp: "2026-11-02T11:15:00Z",
    actorId: 2,
    actorName: "Sarah Jenkins",
    actorRole: "PROJECT_MANAGER",
    action: "TASK_ASSIGNED",
    entityType: "Task",
    entityId: 101,
    details: "Assigned 'Implement Role-Based Workspace Shell' to Alex Mercer",
    ipAddress: "192.168.1.15",
  },
  {
    id: "aud-3",
    timestamp: "2026-11-02T08:30:00Z",
    actorId: 4,
    actorName: "Alex Mercer",
    actorRole: "DEVELOPER",
    action: "BLOCKER_REPORTED",
    entityType: "Task",
    entityId: 105,
    details: "Reported blocker: Telegram bot credentials need staging verification",
    ipAddress: "192.168.1.22",
  },
  {
    id: "aud-4",
    timestamp: "2026-11-01T16:00:00Z",
    actorId: 2,
    actorName: "Sarah Jenkins",
    actorRole: "PROJECT_MANAGER",
    action: "REVIEW_APPROVED",
    entityType: "Task",
    entityId: 103,
    details: "Approved design implementation submitted by Elena Rostova. Moved to DONE.",
    ipAddress: "192.168.1.15",
  },
  {
    id: "aud-5",
    timestamp: "2026-10-31T09:20:00Z",
    actorId: 1,
    actorName: "Master Admin",
    actorRole: "ADMIN",
    action: "USER_CREATED",
    entityType: "User",
    entityId: 8,
    details: "Created developer account for Tariq Haile with temporary credentials",
    ipAddress: "192.168.1.10",
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    userId: 2, // PM Sarah Jenkins
    title: "Blocker Alert Reported",
    message: "Alex Mercer reported a blocker on TASK-105: Telegram bot token credentials required.",
    kind: "BLOCKER",
    readAt: null,
    link: "task-105",
    createdAt: "2026-11-02T08:30:00Z",
  },
  {
    id: "n-2",
    userId: 2, // PM Sarah Jenkins
    title: "Task Submitted for Review",
    message: "David Kim submitted TASK-102 (Audit Log Dispatcher) for code review.",
    kind: "REVIEW",
    readAt: null,
    link: "task-102",
    createdAt: "2026-11-02T10:00:00Z",
  },
  {
    id: "n-3",
    userId: 4, // Dev Alex Mercer
    title: "New Assignment",
    message: "You have been assigned to TASK-101: Implement Role-Based Workspace Shell.",
    kind: "TASK",
    readAt: null,
    link: "task-101",
    createdAt: "2026-11-01T09:00:00Z",
  },
  {
    id: "n-4",
    userId: 1, // Admin
    title: "Custom Role Mutation",
    message: "Permissions updated for Senior Developer custom role.",
    kind: "SYSTEM",
    readAt: "2026-11-02T13:46:00Z",
    createdAt: "2026-11-02T13:45:00Z",
  },
];

export const INITIAL_PLANNER_EVENTS: PlannerEvent[] = [
  {
    id: "pe-1",
    title: "Enterprise Cloud Hub v1.0 Production Release",
    date: "2026-11-15",
    endDate: "2026-11-16",
    type: "RELEASE",
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    isOrganizationWide: true,
    description: "Full production deployment across cloud clusters with high availability.",
  },
  {
    id: "pe-2",
    title: "Q4 Architecture & Security Review",
    date: "2026-11-08",
    type: "REVIEW",
    isOrganizationWide: true,
    description: "Executive audit of RBAC enforcement, session timeouts, and encryption.",
  },
  {
    id: "pe-3",
    title: "Core Navigation Shell Delivery Target",
    date: "2026-11-05",
    type: "DEADLINE",
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    assigneeId: 4,
    isOrganizationWide: false,
    description: "Complete Admin, PM, and Developer role layouts and sidebar switches.",
  },
  {
    id: "pe-4",
    title: "Audit Log & Session Security Code Freeze",
    date: "2026-11-04",
    type: "MILESTONE",
    projectId: 1,
    projectName: "Enterprise Cloud Hub",
    assigneeId: 5,
    isOrganizationWide: false,
    description: "Pass all automated penetration tests and compliance checks.",
  },
  {
    id: "pe-5",
    title: "AI Decomposer Telemetry Benchmark",
    date: "2026-11-10",
    type: "DEADLINE",
    projectId: 2,
    projectName: "AI Telemetry & Workflow Pipeline",
    assigneeId: 7,
    isOrganizationWide: false,
    description: "Demonstrate automated task decomposition on complex enterprise scopes.",
  },
];

// Helper functions for reading & writing to persistent local storage with defaults

export function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getStoredTeams(): Team[] {
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) {
      localStorage.setItem(TEAMS_KEY, JSON.stringify(INITIAL_TEAMS));
      return INITIAL_TEAMS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TEAMS;
  } catch {
    return INITIAL_TEAMS;
  }
}

export function saveStoredTeams(teams: Team[]): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

export function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TASKS;
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveStoredTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function getStoredAuditLogs(): AuditLogItem[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addAuditLog(
  actor: User,
  action: string,
  entityType: string,
  entityId: string | number,
  details: string
): void {
  const current = getStoredAuditLogs();
  const newItem: AuditLogItem = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    details,
    ipAddress: "127.0.0.1",
  };
  localStorage.setItem(AUDIT_KEY, JSON.stringify([newItem, ...current]));
}

export function getStoredNotifications(userId?: number): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    const list: NotificationItem[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    if (userId) {
      return list.filter((n) => n.userId === userId || n.userId === 0);
    }
    return list;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function addNotification(
  userId: number,
  title: string,
  message: string,
  kind: "ALERT" | "BLOCKER" | "REVIEW" | "TASK" | "SYSTEM" | "PROGRESS",
  link?: string
): void {
  const all = getStoredNotifications();
  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title,
    message,
    kind,
    readAt: null,
    link,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(NOTIFS_KEY, JSON.stringify([newItem, ...all]));
}

export function markNotificationRead(id: string | number): void {
  const all = getStoredNotifications();
  const updated = all.map((n) =>
    String(n.id) === String(id) ? { ...n, readAt: new Date().toISOString() } : n
  );
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
}

export function markAllNotificationsRead(userId: number): void {
  const all = getStoredNotifications();
  const updated = all.map((n) =>
    n.userId === userId || n.userId === 0 ? { ...n, readAt: new Date().toISOString() } : n
  );
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
}

export function getStoredPlannerEvents(): PlannerEvent[] {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    if (!raw) {
      localStorage.setItem(PLANNER_KEY, JSON.stringify(INITIAL_PLANNER_EVENTS));
      return INITIAL_PLANNER_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PLANNER_EVENTS;
  } catch {
    return INITIAL_PLANNER_EVENTS;
  }
}

export function saveStoredPlannerEvents(events: PlannerEvent[]): void {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(events));
}

export function addPlannerEvent(event: Omit<PlannerEvent, "id">): PlannerEvent {
  const current = getStoredPlannerEvents();
  const newEvent: PlannerEvent = {
    ...event,
    id: `pe-${Date.now()}`,
  };
  saveStoredPlannerEvents([...current, newEvent]);
  return newEvent;
}
