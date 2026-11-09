import API, {
  addPlannerEvent,
  assignTask,
  createProject,
  createTask,
  deactivateUser,
  deleteProject,
  fetchAuditLogs,
  fetchNotifications,
  fetchPlannerEvents,
  fetchProjects,
  fetchProject,
  fetchTasks,
  fetchUsers,
  getMe,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  register,
  resetPassword,
  updateProject,
  updateTaskField,
  updateTaskStatus,
  updateUser,
  submitReview,
} from "./api";

import { NotificationItem, PlannerEvent } from "../types";

/** Authentication */
export async function fetchMe() {
  return getMe();
}

export async function doLogin(email: string, password: string) {
  return login(email, password);
}

export async function doRegister(email: string, password: string, name: string, role: string) {
  return register(email, password, name, role as any);
}

/** Tasks */
export async function fetchAllTasks() {
  return fetchTasks();
}

export async function createNewTask(payload: {
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  status: string;
  priority: string;
  projectId: number;
  assigneeId?: number | null;
  dueDate?: string;
  labels?: string[];
}) {
  return createTask({
    title: payload.title,
    description: payload.description,
    acceptanceCriteria: payload.acceptanceCriteria,
    status: payload.status,
    priority: payload.priority,
    projectId: payload.projectId,
    assigneeId: payload.assigneeId ?? null,
    dueDate: payload.dueDate,
    labels: payload.labels,
  });
}

export async function changeTaskStatus(taskId: number, status: string) {
  return updateTaskStatus(taskId, status);
}

export async function changeTaskField(taskId: number, field: string, value: unknown) {
  return updateTaskField(taskId, field, value);
}

export async function reassignTask(taskId: number, assigneeId: number) {
  return assignTask(taskId, assigneeId);
}

export async function submitTaskReview(taskId: number, comment: string) {
  return submitReview(taskId, comment);
}

/** Projects */
export async function fetchAllProjects() {
  return fetchProjects();
}

export async function createNewProject(payload: {
  name: string;
  description: string;
  updateIntervalDays?: number;
  deadline?: string;
  requirements?: string;
  repoUrl?: string;
  techStack?: string;
}) {
  return createProject({
    name: payload.name,
    description: payload.description,
    updateIntervalDays: payload.updateIntervalDays,
    deadline: payload.deadline,
    requirements: payload.requirements,
    repoUrl: payload.repoUrl,
    techStack: payload.techStack,
  });
}

export async function updateExistingProject(projectId: number, payload: {
  name?: string;
  description?: string;
  status?: string;
  statusReason?: string;
  techStack?: string;
}) {
  return updateProject(projectId, {
    name: payload.name,
    description: payload.description,
    status: payload.status,
    statusReason: payload.statusReason,
    techStack: payload.techStack,
  });
}

export async function removeProject(projectId: number) {
  return deleteProject(projectId);
}

export async function fetchOneProject(projectId: number) {
  return fetchProject(projectId);
}

/** Users (admin) */
export async function fetchAllUsers() {
  return fetchUsers();
}

export async function createNewUser(payload: { name: string; email: string; password: string; role: string }) {
  return createUser({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  });
}

export async function changeUserRole(userId: number, role: string) {
  return updateUser(userId, { role });
}

export async function changeUserName(userId: number, name: string) {
  return updateUser(userId, { name });
}

export async function changeUserEmail(userId: number, email: string) {
  return updateUser(userId, { email });
}

export async function resetUserPassword(userId: number, password: string) {
  return resetPassword(userId, password);
}

export async function deactivateThisUser(userId: number) {
  return deactivateUser(userId);
}

/** Notifications */
export async function fetchUserNotifications() {
  return fetchNotifications();
}

export async function markAllNotificationsAsRead() {
  return markAllNotificationsRead();
}

export async function markThisNotificationRead(notificationId: number) {
  return markNotificationRead(notificationId);
}

/** Planner events */
export async function fetchPlannerEventsList() {
  return fetchPlannerEvents();
}

export async function addPlannerEventToStore(event: Omit<PlannerEvent, "id">) {
  return addPlannerEvent(event);
}

/** Audit logs */
export async function fetchAuditLogHistory() {
  return fetchAuditLogs();
}


