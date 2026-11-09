import axios from "axios";
import { UserRole } from "../types";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export async function getMe() {
  const res = await API.get("/me");
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await API.post("/auth/login", { email, password });
  return res.data;
}

export async function fetchTasks() {
  const res = await API.get("/tasks");
  return res.data;
}

export async function createTask(data: { title: string; description?: string; acceptanceCriteria?: string[]; status: string; priority: string; projectId: number; assigneeId?: number | null; dueDate?: string; labels?: string[] }) {
  const res = await API.post("/tasks", data);
  return res.data;
}

export async function updateTaskStatus(taskId: number, status: string) {
  const res = await API.patch(`/tasks/${taskId}/status`, { status });
  return res.data;
}

export async function updateTaskField(taskId: number, field: string, value: unknown) {
  const res = await API.patch(`/tasks/${taskId}`, { [field]: value });
  return res.data;
}

export async function assignTask(taskId: number, assigneeId: number) {
  const res = await API.patch(`/tasks/${taskId}/assign`, { assigneeId });
  return res.data;
}

export async function submitReview(taskId: number, comment: string) {
  const res = await API.post(`/tasks/${taskId}/review`, { comment });
  return res.data;
}

export async function fetchProjects() {
  const res = await API.get("/projects");
  return res.data;
}

export async function createProject(data: { name: string; description: string; updateIntervalDays?: number; deadline?: string; requirements?: string; repoUrl?: string; techStack?: string }) {
  const res = await API.post("/projects", data);
  return res.data;
}

export async function updateProject(projectId: number, data: { name?: string; description?: string; status?: string; statusReason?: string; techStack?: string }) {
  const res = await API.put(`/projects/${projectId}`, data);
  return res.data;
}

export async function deleteProject(projectId: number) {
  const res = await API.delete(`/projects/${projectId}`);
  return res.data;
}

export async function fetchProject(projectId: number) {
  const res = await API.get(`/projects/${projectId}`);
  return res.data;
}

export async function fetchUsers() {
  const res = await API.get("/admin/users");
  return res.data;
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const res = await API.post("/admin/users", data);
  return res.data;
}

export async function updateUser(userId: number, data: { name?: string; email?: string; role?: string; status?: string }) {
  const res = await API.patch(`/admin/users/${userId}`, data);
  return res.data;
}

export async function resetPassword(userId: number, password: string) {
  const res = await API.post(`/admin/users/${userId}/reset-password`, { password });
  return res.data;
}

export async function deactivateUser(userId: number) {
  const res = await API.delete(`/admin/users/${userId}`);
  return res.data;
}

export async function fetchNotifications() {
  const res = await API.get("/me/notifications");
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await API.post("/me/notifications/read-all");
  return res.data;
}

export async function markNotificationRead(notificationId: number) {
  const res = await API.post(`/me/notifications/${notificationId}/read`);
  return res.data;
}

export async function fetchPlannerEvents() {
  const res = await API.get("/planner");
  return res.data;
}

export async function addPlannerEvent(event: { title: string; date: string; type: string; isOrganizationWide?: boolean; projectId?: number; projectName?: string }) {
  const res = await API.post("/planner", event);
  return res.data;
}

export async function fetchAuditLogs() {
  const res = await API.get("/admin/audit");
  return res.data;
}

export default API;

