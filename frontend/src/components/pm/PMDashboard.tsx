import React, { useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Project, Task, User } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface PMDashboardProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  onNavigate: (tab: string) => void;
  onSelectTask: (task: Task) => void;
  onOpenCreateProject: () => void;
  onOpenCreateTask: () => void;
}

export const PMDashboard: React.FC<PMDashboardProps> = ({
  projects,
  tasks,
  users,
  onNavigate,
  onSelectTask,
  onOpenCreateProject,
  onOpenCreateTask,
}) => {
  const { user } = useAuth();

  // Filter projects managed by this PM (or all if admin)
  const managedProjects = useMemo(() => {
    if (user?.role === "ADMIN") return projects;
    return projects.filter((p) => p.pmId === user?.id || !p.pmId);
  }, [projects, user]);

  const managedProjectIds = useMemo(() => managedProjects.map((p) => p.id), [managedProjects]);

  const managedTasks = useMemo(() => {
    return tasks.filter((t) => managedProjectIds.includes(t.projectId));
  }, [tasks, managedProjectIds]);

  const completed = managedTasks.filter((t) => t.status === "DONE");
  const inProgress = managedTasks.filter((t) => t.status === "IN_PROGRESS");
  const inReview = managedTasks.filter((t) => t.status === "IN_REVIEW");
  const blocked = managedTasks.filter((t) => t.status === "BLOCKED" || !!t.blocker);

  const overdue = useMemo(() => {
    const now = new Date();
    return managedTasks.filter((t) => {
      if (t.status === "DONE" || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < now.getTime();
    });
  }, [managedTasks]);

  const upcoming = useMemo(() => {
    return managedTasks
      .filter((t) => t.status !== "DONE" && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [managedTasks]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Project Delivery Workspace
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-xs text-[#888]">
            Manage sprint velocity, developer assignments, code reviews, and project milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateTask}
            className="rounded-xl border border-[#333] bg-[#171717] px-4 py-2.5 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
          >
            Create Task
          </button>
          <button
            onClick={onOpenCreateProject}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* Blockers Alert strip */}
      {blocked.length > 0 && (
        <div className="flex items-start justify-between rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-semibold text-red-200">
                {blocked.length} Active Blocker{blocked.length > 1 ? "s" : ""} Reported by Developers
              </h4>
              <p className="text-[11px] text-red-300/80 mt-0.5">
                Tasks in your managed projects are blocked waiting for your review or dependency resolution.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("Kanban Boards")}
            className="text-xs font-medium text-red-300 underline underline-offset-4"
          >
            Open Kanban Board
          </button>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Managed Projects</span>
            <FolderKanban size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{managedProjects.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">Authorized delivery scopes</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Tasks In Progress</span>
            <Clock size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{inProgress.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">{managedTasks.length} total tasks tracked</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Awaiting Review</span>
            <AlertCircle size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{inReview.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">Submitted code awaiting your approval</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Completed Deliveries</span>
            <CheckCircle2 size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{completed.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">
            {managedTasks.length ? Math.round((completed.length / managedTasks.length) * 100) : 0}% completion
          </p>
        </div>
      </div>

      {/* Managed Projects & Upcoming Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Managed Projects Portfolio */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">My Projects</h2>
              <p className="text-xs text-[#777] mt-0.5">Projects authorized under your management</p>
            </div>
            <button
              onClick={() => onNavigate("My Projects")}
              className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
            >
              All Projects <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3.5">
            {managedProjects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const done = projTasks.filter((t) => t.status === "DONE").length;
              const rate = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">{proj.name}</h3>
                      <p className="text-[11px] text-[#777] mt-0.5 line-clamp-1">{proj.description}</p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-white">{rate}%</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#242424]">
                    <div
                      className="h-full rounded-full bg-neutral-300 transition-all"
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777]">
                    <span>{projTasks.length} tasks</span>
                    <span>Deadline: {proj.deadline || "Ongoing"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Nearest Deadlines */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Upcoming Target Deadlines</h2>
              <p className="text-xs text-[#777] mt-0.5">Next deliverables requiring attention</p>
            </div>
            <button
              onClick={() => onNavigate("Planner")}
              className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
            >
              Planner <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {upcoming.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#171717] p-3.5 hover:bg-[#1c1c1c] transition cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#888]">TASK-{task.id}</span>
                    <p className="text-xs font-medium text-white truncate">{task.title}</p>
                  </div>
                  <p className="text-[11px] text-[#777] mt-0.5 truncate">
                    {task.projectName} · {task.assignee?.name || "Unassigned"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-[#bbb] font-medium">{task.dueDate}</span>
                  <span className="block text-[10px] uppercase text-[#666]">{task.status}</span>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="py-10 text-center text-xs text-[#666]">No upcoming deadlines.</p>
            )}
          </div>
        </section>
      </div>

      {/* Developer Workload */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Developer Workload in Your Projects</h2>
            <p className="text-xs text-[#777] mt-0.5">Current assignments and capacity distribution</p>
          </div>
          <button
            onClick={() => onNavigate("Team Workload")}
            className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
          >
            Capacity Details <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {users
            .filter((u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER")
            .map((dev) => {
              const devTasks = managedTasks.filter((t) => t.assigneeId === dev.id);
              const open = devTasks.filter((t) => t.status !== "DONE").length;
              const hasBlocked = devTasks.some((t) => t.status === "BLOCKED");

              return (
                <div
                  key={dev.id}
                  className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#242424] text-xs font-bold text-white">
                      {dev.avatar || dev.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{dev.name}</p>
                      <p className="text-[10px] text-[#777] truncate">{dev.specialty || "Developer"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#242424]">
                    <span className="text-[#777]">Open tasks:</span>
                    <span className="font-semibold text-white">{open}</span>
                  </div>
                  {hasBlocked && (
                    <span className="block rounded bg-red-950/40 p-1 text-center text-[10px] font-semibold text-red-300 border border-red-900/40">
                      Has Blocked Work
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};
