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

const USERS_KEY = "nexus_users_clean_v3";
const TEAMS_KEY = "nexus_teams_clean_v3";
const TASKS_KEY = "nexus_tasks_clean_v3";
const AUDIT_KEY = "nexus_audit_clean_v3";
const NOTIFS_KEY = "nexus_notifs_clean_v3";
const PLANNER_KEY = "nexus_planner_clean_v3";

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
    assignedPmId: 2,
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

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_PLANNER_EVENTS: PlannerEvent[] = [];

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
