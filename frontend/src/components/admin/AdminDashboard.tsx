import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FolderKanban,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Project, Task, User } from "../../types";

interface AdminDashboardProps {
  users: User[];
  projects: Project[];
  tasks: Task[];
  onNavigate: (tab: string) => void;
  onSelectTask: (task: Task) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  projects,
  tasks,
  onNavigate,
  onSelectTask,
}) => {
  const [expandedProjectDesc, setExpandedProjectDesc] = useState<Set<number>>(new Set());

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const pmCount = users.filter((u) => ["MANAGER", "PROJECT_MANAGER"].includes(u.role)).length;
  const devCount = users.filter((u) => ["DEVELOPER", "SENIOR_DEVELOPER"].includes(u.role)).length;

  const activeProjects = projects.filter((p) => p.status === "ACTIVE" || !p.status);
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED" || !!t.blocker);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status === "DONE" || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < now.getTime();
    });
  }, [tasks]);

  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#777]">
            Organization Control Center
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Executive Command & Governance
          </h1>
          <p className="mt-1 text-xs text-[#888]">
            Real-time telemetry across all teams, projects, access controls, and security posture.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("User Management")}
            className="rounded-xl border border-[#333] bg-[#171717] px-4 py-2.5 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
          >
            Provision User
          </button>
          <button
            onClick={() => onNavigate("Roles & Permissions")}
            className="rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            Manage Permissions Matrix
          </button>
        </div>
      </div>

      {/* Critical Alerts Strip if any blockers or overdue items */}
      {(blockedTasks.length > 0 || overdueTasks.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {blockedTasks.length > 0 && (
            <div className="flex items-start justify-between rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-semibold text-red-200">
                    {blockedTasks.length} Escalated Blockers Detected
                  </h4>
                  <p className="text-[11px] text-red-300/80 mt-0.5">
                    Developers have reported critical blockers requiring PM resolution.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("Projects")}
                className="text-xs font-medium text-red-300 underline underline-offset-4"
              >
                Inspect
              </button>
            </div>
          )}

          {overdueTasks.length > 0 && (
            <div className="flex items-start justify-between rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <Clock className="text-amber-400 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-semibold text-amber-200">
                    {overdueTasks.length} Overdue Task Deadlines
                  </h4>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Tasks have surpassed estimated completion dates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("Organization Planner")}
                className="text-xs font-medium text-amber-300 underline underline-offset-4"
              >
                Review Planner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Total Organization Users</span>
            <Users size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{users.length}</p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#777]">
            <span>{adminCount} Admins</span>
            <span>·</span>
            <span>{pmCount} PMs</span>
            <span>·</span>
            <span>{devCount} Developers</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Active Projects</span>
            <FolderKanban size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{activeProjects.length}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#777]">
            <span>{completedProjects.length} completed</span>
            <span>·</span>
            <span>{projects.length} total portfolios</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Tracked Tasks</span>
            <Briefcase size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{tasks.length}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#777]">
            <span>{inProgressTasks.length} in progress</span>
            <span>·</span>
            <span>{inReviewTasks.length} in review</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Overall Velocity</span>
            <TrendingUp size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{completionRate}%</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#777]">
            <span>{completedTasks.length} tasks closed</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Project Portfolios & Team Workloads */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Health & Progress */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Project Portfolios Health</h2>
              <p className="text-xs text-[#777] mt-0.5">Execution status across organizational projects</p>
            </div>
            <button
              onClick={() => onNavigate("Projects")}
              className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.projectId === project.id);
              const done = projectTasks.filter((t) => t.status === "DONE").length;
              const rate = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
              const hasBlocked = projectTasks.some((t) => t.status === "BLOCKED");

              return (
                <div
                  key={project.id}
                  className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{project.name}</span>
                        {hasBlocked && (
                          <span className="rounded-md border border-red-900/60 bg-red-950/20 px-2 py-0.5 text-[9px] font-semibold text-red-300">
                            BLOCKED
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className="text-[11px] text-[#777]">
                          {expandedProjectDesc.has(project.id)
                            ? (project.description || "Active software development lifecycle project.")
                            : ((project.description || "Active software development lifecycle project.").length > 50
                              ? (project.description || "Active software development lifecycle project.").slice(0, 50) + "..."
                              : (project.description || "Active software development lifecycle project."))}
                        </p>
                        {(project.description || "").length > 50 && (
                          <button
                            onClick={() => {
                              setExpandedProjectDesc((prev) => {
                                const next = new Set(prev);
                                if (next.has(project.id)) {
                                  next.delete(project.id);
                                } else {
                                  next.add(project.id);
                                }
                                return next;
                              });
                            }}
                            className="text-[10px] text-[#888] hover:text-white mt-0.5 underline underline-offset-2"
                          >
                            {expandedProjectDesc.has(project.id) ? "Show less" : "See details"}
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#ddd]">{rate}%</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#242424]">
                    <div
                      className="h-full rounded-full bg-neutral-300 transition-all duration-300"
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777] pt-1">
                    <span>{projectTasks.length} tasks</span>
                    <span>Deadline: {project.deadline || "Ongoing"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Developer Workload & Capacity */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Developer Allocation & Capacity</h2>
              <p className="text-xs text-[#777] mt-0.5">Active assignments distribution per developer</p>
            </div>
            <button
              onClick={() => onNavigate("Teams & Departments")}
              className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
            >
              Teams <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-4">
            {users
              .filter((u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER")
              .map((dev) => {
                const devTasks = tasks.filter((t) => t.assigneeId === dev.id);
                const active = devTasks.filter((t) => t.status !== "DONE").length;
                const blocked = devTasks.filter((t) => t.status === "BLOCKED").length;

                return (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#171717] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222] text-xs font-bold text-white border border-[#333]">
                        {dev.avatar || dev.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{dev.name}</span>
                          {dev.specialty && (
                            <span className="rounded bg-[#202020] px-1.5 py-0.5 text-[9px] text-[#999]">
                              {dev.specialty}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#777] mt-0.5">{dev.team || "Engineering"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {blocked > 0 && (
                        <span className="rounded-md border border-red-900/60 bg-red-950/20 px-2 py-0.5 text-[10px] text-red-300 font-semibold">
                          {blocked} blocked
                        </span>
                      )}
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#eee]">{active}</span>
                        <span className="text-[10px] text-[#777] ml-1">open tasks</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>

      {/* Critical Tasks Needing Admin Visibility */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden">
        <div className="border-b border-[#242424] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Escalated & High-Priority Items</h2>
            <p className="text-xs text-[#777] mt-0.5">Tasks requiring cross-departmental coordination</p>
          </div>
          <span className="text-[11px] font-mono text-[#777]">
            {tasks.filter((t) => t.priority === "CRITICAL" || t.status === "BLOCKED").length} FLAGGED
          </span>
        </div>

        <div className="divide-y divide-[#222]">
          {tasks
            .filter((t) => t.priority === "CRITICAL" || t.status === "BLOCKED")
            .map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 hover:bg-[#181818] transition cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-[#333] bg-[#191919] px-2 py-0.5 text-[10px] font-mono text-[#aaa]">
                      TASK-{task.id}
                    </span>
                    <span className="text-xs font-semibold text-white">{task.title}</span>
                  </div>
                  <p className="text-[11px] text-[#777] mt-1 line-clamp-1">
                    {task.projectName} · Assigned to {task.assignee?.name || "Unassigned"}
                  </p>
                </div>

                <div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                      task.status === "BLOCKED"
                        ? "border-red-900/60 bg-red-950/20 text-red-300"
                        : "border-[#333] bg-[#1a1a1a] text-[#aaa]"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="text-right text-xs text-[#888]">
                  {task.dueDate || "No date"}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};
