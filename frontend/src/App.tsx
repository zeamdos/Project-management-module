import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  FolderKanban,
  GitBranch,
  Layers,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Project, Task, TaskStatus, User, UserRole } from "./types";
import API from "./services/api";
import {
  getStoredTasks,
  getStoredUsers,
  saveStoredTasks,
} from "./services/mockDataStore";

// Admin Components
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { UserManagement } from "./components/admin/UserManagement";
import { RolesPermissions } from "./components/admin/RolesPermissions";
import { TeamsDepartments } from "./components/admin/TeamsDepartments";
import { AdminPlanner } from "./components/admin/AdminPlanner";
import { ReportsAnalytics } from "./components/admin/ReportsAnalytics";
import { AuditLogs } from "./components/admin/AuditLogs";
import { WorkspaceSettings } from "./components/admin/WorkspaceSettings";

// PM Components
import { PMDashboard } from "./components/pm/PMDashboard";
import { PMProjects } from "./components/pm/PMProjects";
import { PMKanbanBoard } from "./components/pm/PMKanbanBoard";
import { PMReviews } from "./components/pm/PMReviews";
import { PMTeamWorkload } from "./components/pm/PMTeamWorkload";

// Developer Components
import { DeveloperDashboard } from "./components/developer/DeveloperDashboard";
import { DeveloperKanban } from "./components/developer/DeveloperKanban";
import { DeveloperTasks } from "./components/developer/DeveloperTasks";
import { DeveloperGithub } from "./components/developer/DeveloperGithub";

// Shared Components
import { TaskDetailModal } from "./components/shared/TaskDetailModal";
import { CreateProjectModal } from "./components/shared/CreateProjectModal";
import { CreateTaskModal } from "./components/shared/CreateTaskModal";
import { ChangePasswordModal } from "./components/shared/ChangePasswordModal";
import { NotificationDropdown } from "./components/shared/NotificationDropdown";
import { ProfilePage } from "./components/shared/ProfilePage";
import { RoleAwarePlanner } from "./components/shared/RoleAwarePlanner";

// Navigation configurations for each role
const ADMIN_NAV = [
  { label: "Organization Overview", icon: LayoutDashboard },
  { label: "User Management", icon: Users },
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Projects", icon: FolderKanban },
  { label: "Teams & Departments", icon: Layers },
  { label: "Organization Planner", icon: CalendarDays },
  { label: "Reports & Analytics", icon: TrendingUp },
  { label: "Activity & Audit Logs", icon: Activity },
  { label: "Workspace Settings", icon: Settings },
  { label: "My Profile", icon: UserCheck },
];

const PM_NAV = [
  { label: "My Dashboard", icon: LayoutDashboard },
  { label: "My Projects", icon: FolderKanban },
  { label: "Kanban Boards", icon: ListTodo },
  { label: "Code Reviews", icon: CheckCircle2 },
  { label: "Team Workload", icon: Users },
  { label: "Planner", icon: CalendarDays },
  { label: "Reports", icon: TrendingUp },
  { label: "My Profile", icon: UserCheck },
];

const DEV_NAV = [
  { label: "My Dashboard", icon: LayoutDashboard },
  { label: "My Tasks", icon: ListTodo },
  { label: "My Kanban Board", icon: FolderKanban },
  { label: "My Planner", icon: CalendarDays },
  { label: "GitHub Activity", icon: GitBranch },
  { label: "My Profile", icon: UserCheck },
];

function MainWorkspace() {
  const { user, token, login, logout, allUsers, refreshUsers } = useAuth();


  // Role detection
  const normalizedRole = useMemo(() => {
    const r = (user?.role || "").toUpperCase();
    if (r === "ADMIN") return "ADMIN";
    if (r === "MANAGER" || r === "PROJECT_MANAGER") return "PROJECT_MANAGER";
    return "DEVELOPER";
  }, [user]);

  // Tab state default depends on role
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (normalizedRole === "ADMIN") return "Organization Overview";
    return "My Dashboard";
  });

  // Switch default tab when role switches
  useEffect(() => {
    if (normalizedRole === "ADMIN") setActiveTab("Organization Overview");
    else setActiveTab("My Dashboard");
  }, [normalizedRole]);

  // Projects & Tasks State
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "Enterprise Cloud Hub",
      description: "Scalable cloud orchestration gateway and role management platform.",
      status: "ACTIVE",
      techStack: "React, Node.js, TypeORM",
      deadline: "2026-11-20",
      createdAt: "2026-10-15T00:00:00Z",
    },
    {
      id: 2,
      name: "AI Telemetry & Workflow Pipeline",
      description: "Automated task decomposition engine and developer skill telemetry matching.",
      status: "ACTIVE",
      techStack: "Python, FastAPI, NLP",
      deadline: "2026-11-28",
      createdAt: "2026-10-20T00:00:00Z",
    },
  ]);

  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<TaskStatus>("TODO");
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Fetch real projects from API if token available
  const fetchApiProjects = async () => {
    try {
      const res = await API.get("/projects");
      const list = res.data?.data || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setProjects(list);
      }
    } catch {
      // Offline fallback already loaded
    }
  };

  useEffect(() => {
    if (token) {
      fetchApiProjects();
    }
  }, [token]);

  const handleUpdateTask = (updated: Task) => {
    const updatedList = tasks.map((t) => (t.id === updated.id ? updated : t));
    setTasks(updatedList);
    saveStoredTasks(updatedList);
    setSelectedTask(updated);

    // Call backend patch if available
    API.patch(`/tasks/${updated.id}/status`, { status: updated.status }).catch(() => undefined);
  };

  const handleTaskCreated = (newTask: Task) => {
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveStoredTasks(updated);
  };

  const handleProjectCreated = (newProj: Project) => {
    setProjects([newProj, ...projects]);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Invalid email or credentials.");
    } finally {
      setLoggingIn(false);
    }
  };

  // If unauthenticated: render dark login screen with organization admin notice
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090909] px-4 text-[#ededed]">
        <div className="w-full max-w-md rounded-3xl border border-[#262626] bg-[#121212] p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#222] pb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1e1e1e] border border-[#333] text-white">
              <FolderKanban size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">NEXUS ENTERPRISE</h1>
              <p className="text-xs text-[#777]">Role-Based Project Management Workspace</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#2b2b2b] bg-[#171717] p-3 text-xs text-[#999] leading-relaxed">
            <strong className="text-white block mb-0.5">Closed Provisioning System:</strong>
            Accounts are provisioned by your organization Administrator. Public registration is closed.
          </div>

          {loginError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertCircle size={15} /> <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@enterprise.com"
                className="w-full rounded-xl border border-[#303030] bg-[#0c0c0c] px-4 py-3 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-[#303030] bg-[#0c0c0c] px-4 py-3 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-[#e5e5e5] py-3 text-xs font-semibold text-[#141414] hover:bg-white disabled:opacity-50 transition"
            >
              {loggingIn ? "Authenticating..." : "Sign in to Workspace"}
            </button>
          </form>
        </div>
      </div>
    );
  }


  // Active navigation items for current role
  const navItems =
    normalizedRole === "ADMIN"
      ? ADMIN_NAV
      : normalizedRole === "PROJECT_MANAGER"
      ? PM_NAV
      : DEV_NAV;

  return (
    <div className="flex min-h-screen bg-[#0b0b0b] text-[#ededed]">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#222] bg-[#111] transition-transform duration-200 md:static md:translate-x-0`}
      >
        {/* Workspace Brand */}
        <div className="flex h-16 items-center justify-between border-b border-[#222] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#222] border border-[#333] text-white">
              <FolderKanban size={16} />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider text-white">NEXUS</span>
              <span className="block text-[9px] uppercase tracking-widest text-[#666]">
                {normalizedRole} SPACE
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#666] md:hidden hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role Workspace Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#666]">
            {normalizedRole === "ADMIN"
              ? "Organization Control"
              : normalizedRole === "PROJECT_MANAGER"
              ? "Delivery Workspace"
              : "Developer Station"}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;

            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveTab(item.label);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-[#252525] text-white font-semibold shadow-sm"
                    : "text-[#888] hover:bg-[#181818] hover:text-[#ddd]"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>

        {/* User Identity Footer */}
        <div className="border-t border-[#222] p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#161616] p-2.5 border border-[#242424]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#252525] text-xs font-bold text-white border border-[#333]">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "U")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[10px] font-mono text-[#777] uppercase">
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#262626] px-3 py-2 text-xs text-[#888] hover:bg-[#1c1c1c] hover:text-white transition"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
        />
      )}

      {/* Main Workspace Frame */}
      <main className="min-w-0 flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#222] bg-[#0d0d0d]/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-[#888] md:hidden hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="text-xs text-[#777]">
              <span>Workspace</span>
              <span className="mx-2 text-[#444]">/</span>
              <span className="font-mono text-[#aaa] uppercase">{normalizedRole}</span>
              <span className="mx-2 text-[#444]">/</span>
              <span className="text-white font-medium">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Authenticated Role Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] px-3 py-1.5 text-[11px]">
              <Shield size={13} className="text-[#888]" />
              <span className="font-mono text-[#aaa] font-medium">{user?.role}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>


            {/* In-App Notifications */}
            <NotificationDropdown
              onSelectTask={(taskId) => {
                const found = tasks.find((t) => t.id === taskId);
                if (found) setSelectedTask(found);
              }}
            />

            {/* Profile Avatar trigger */}
            <button
              onClick={() => setActiveTab("My Profile")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333] bg-[#222] text-xs font-bold text-white hover:border-[#666] transition"
              title="My Profile"
            >
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "U")}
            </button>
          </div>
        </header>

        {/* Role Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* ================= ADMIN WORKSPACE ================= */}
          {normalizedRole === "ADMIN" && (
            <>
              {activeTab === "Organization Overview" && (
                <AdminDashboard
                  users={allUsers}
                  projects={projects}
                  tasks={tasks}
                  onNavigate={setActiveTab}
                  onSelectTask={setSelectedTask}
                />
              )}

              {activeTab === "User Management" && (
                <UserManagement
                  onConfigureUserPermissions={(u) => {
                    setSelectedUserForPerms(u);
                    setActiveTab("Roles & Permissions");
                  }}
                />
              )}

              {activeTab === "Roles & Permissions" && (
                <RolesPermissions initialSelectedUser={selectedUserForPerms} />
              )}

              {activeTab === "Projects" && (
                <PMProjects
                  projects={projects}
                  tasks={tasks}
                  onRefreshProjects={fetchApiProjects}
                  onOpenCreateModal={() => setShowCreateProject(true)}
                />
              )}

              {activeTab === "Teams & Departments" && <TeamsDepartments />}

              {activeTab === "Organization Planner" && (
                <AdminPlanner projects={projects} />
              )}

              {activeTab === "Reports & Analytics" && (
                <ReportsAnalytics projects={projects} tasks={tasks} users={allUsers} />
              )}

              {activeTab === "Activity & Audit Logs" && <AuditLogs />}

              {activeTab === "Workspace Settings" && <WorkspaceSettings />}

              {activeTab === "My Profile" && <ProfilePage />}
            </>
          )}

          {/* ================= PROJECT MANAGER WORKSPACE ================= */}
          {normalizedRole === "PROJECT_MANAGER" && (
            <>
              {activeTab === "My Dashboard" && (
                <PMDashboard
                  projects={projects}
                  tasks={tasks}
                  users={allUsers}
                  onNavigate={setActiveTab}
                  onSelectTask={setSelectedTask}
                  onOpenCreateProject={() => setShowCreateProject(true)}
                  onOpenCreateTask={() => {
                    setCreateTaskDefaultStatus("TODO");
                    setShowCreateTask(true);
                  }}
                />
              )}

              {activeTab === "My Projects" && (
                <PMProjects
                  projects={projects}
                  tasks={tasks}
                  onRefreshProjects={fetchApiProjects}
                  onOpenCreateModal={() => setShowCreateProject(true)}
                />
              )}

              {activeTab === "Kanban Boards" && (
                <PMKanbanBoard
                  tasks={tasks}
                  projects={projects}
                  users={allUsers}
                  onSelectTask={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                  onOpenCreateTask={(defaultCol) => {
                    setCreateTaskDefaultStatus(defaultCol || "TODO");
                    setShowCreateTask(true);
                  }}
                />
              )}

              {activeTab === "Code Reviews" && (
                <PMReviews
                  tasks={tasks}
                  onSelectTask={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}

              {activeTab === "Team Workload" && (
                <PMTeamWorkload
                  tasks={tasks}
                  users={allUsers}
                  onSelectTask={setSelectedTask}
                />
              )}

              {activeTab === "Planner" && (
                <RoleAwarePlanner
                  tasks={tasks}
                  projects={projects}
                  onSelectTask={setSelectedTask}
                />
              )}

              {activeTab === "Reports" && (
                <ReportsAnalytics projects={projects} tasks={tasks} users={allUsers} />
              )}

              {activeTab === "My Profile" && <ProfilePage />}
            </>
          )}

          {/* ================= DEVELOPER WORKSPACE ================= */}
          {normalizedRole === "DEVELOPER" && (
            <>
              {activeTab === "My Dashboard" && (
                <DeveloperDashboard
                  tasks={tasks}
                  projects={projects}
                  onNavigate={setActiveTab}
                  onSelectTask={setSelectedTask}
                />
              )}

              {activeTab === "My Tasks" && (
                <DeveloperTasks tasks={tasks} onSelectTask={setSelectedTask} />
              )}

              {activeTab === "My Kanban Board" && (
                <DeveloperKanban
                  tasks={tasks}
                  onSelectTask={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}

              {activeTab === "My Planner" && (
                <RoleAwarePlanner
                  tasks={tasks}
                  projects={projects}
                  onSelectTask={setSelectedTask}
                />
              )}

              {activeTab === "GitHub Activity" && <DeveloperGithub />}

              {activeTab === "My Profile" && <ProfilePage />}
            </>
          )}
        </div>
      </main>

      {/* Global Modals */}
      <ChangePasswordModal />

      <TaskDetailModal
        task={selectedTask}
        allUsers={allUsers}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
      />

      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          projects={projects}
          users={allUsers}
          defaultStatus={createTaskDefaultStatus}
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainWorkspace />
    </AuthProvider>
  );
}

export default App;
