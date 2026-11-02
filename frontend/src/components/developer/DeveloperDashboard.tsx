import React, { useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderKanban,
  GitCommit,
  GitPullRequest,
  ListTodo,
  ShieldAlert,
} from "lucide-react";
import { Project, Task, User } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface DeveloperDashboardProps {
  tasks: Task[];
  projects: Project[];
  onNavigate: (tab: string) => void;
  onSelectTask: (task: Task) => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  tasks,
  projects,
  onNavigate,
  onSelectTask,
}) => {
  const { user } = useAuth();

  // Filter tasks strictly assigned to this developer
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user?.id);
  }, [tasks, user]);

  const inProgress = myTasks.filter((t) => t.status === "IN_PROGRESS");
  const inReview = myTasks.filter((t) => t.status === "IN_REVIEW");
  const completed = myTasks.filter((t) => t.status === "DONE");
  const blocked = myTasks.filter((t) => t.status === "BLOCKED" || !!t.blocker);

  const overdue = useMemo(() => {
    const now = new Date();
    return myTasks.filter((t) => {
      if (t.status === "DONE" || !t.dueDate) return false;
      return new Date(t.dueDate).getTime() < now.getTime();
    });
  }, [myTasks]);

  const upcoming = useMemo(() => {
    return myTasks
      .filter((t) => t.status !== "DONE" && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [myTasks]);

  // Projects assigned to this developer
  const myProjects = useMemo(() => {
    const pids = Array.from(new Set(myTasks.map((t) => t.projectId)));
    return projects.filter((p) => pids.includes(p.id));
  }, [projects, myTasks]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#777]">
          Developer Personal Workspace
        </span>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
          Focused Workstation · {user?.name}
        </h1>
        <p className="mt-1 text-xs text-[#888]">
          Your active queue, pull request links, blockers, and upcoming deadlines.
        </p>
      </div>

      {/* Blocker Alert if any tasks are blocked */}
      {blocked.length > 0 && (
        <div className="flex items-start justify-between rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-400 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-semibold text-red-200">
                You have {blocked.length} blocked task{blocked.length > 1 ? "s" : ""}
              </h4>
              <p className="text-[11px] text-red-300/80 mt-0.5">
                The responsible Project Manager has been alerted with your blocker details.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("My Tasks")}
            className="text-xs font-medium text-red-300 underline underline-offset-4"
          >
            Review Blocker
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Assigned To Me</span>
            <ListTodo size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{myTasks.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">{myProjects.length} active projects</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">In Progress</span>
            <Clock size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{inProgress.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">Currently working on</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Awaiting PM Review</span>
            <AlertCircle size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{inReview.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">Submitted for code review</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <div className="flex items-center justify-between text-[#888]">
            <span className="text-xs font-medium text-[#aaa]">Delivered (Done)</span>
            <CheckCircle2 size={17} />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">{completed.length}</p>
          <p className="mt-2 text-[11px] text-[#777]">Successfully approved</p>
        </div>
      </div>

      {/* Active Sprint Queue & Deadlines */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Active Tasks */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Active Queue</h2>
              <p className="text-xs text-[#777] mt-0.5">Tasks currently in development or awaiting review</p>
            </div>
            <button
              onClick={() => onNavigate("My Kanban Board")}
              className="text-xs text-[#bbb] hover:text-white transition flex items-center gap-1"
            >
              My Kanban <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3">
            {[...inProgress, ...inReview].map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#171717] p-4 hover:bg-[#1c1c1c] transition cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#777]">TASK-{task.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                        task.status === "IN_REVIEW"
                          ? "bg-amber-950/40 text-amber-300 border border-amber-900/50"
                          : "bg-[#222] text-[#aaa]"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate mt-1">
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-[#777] mt-0.5 truncate">
                    {task.projectName} · Due: {task.dueDate || "No deadline"}
                  </p>
                </div>
                <ArrowRight size={15} className="text-[#666]" />
              </div>
            ))}

            {[...inProgress, ...inReview].length === 0 && (
              <p className="py-12 text-center text-xs text-[#666]">
                Your active queue is clear. Pick up a task from &ldquo;To Do&rdquo; on your Kanban board.
              </p>
            )}
          </div>
        </section>

        {/* Assigned Projects Directory */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">My Projects</h2>
            <p className="text-xs text-[#777] mt-0.5">Projects containing tasks allocated to you</p>
          </div>

          <div className="space-y-3">
            {myProjects.map((p) => {
              const myProjTasks = myTasks.filter((t) => t.projectId === p.id);
              const done = myProjTasks.filter((t) => t.status === "DONE").length;

              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white">{p.name}</h3>
                      <p className="text-[11px] text-[#777] mt-0.5 line-clamp-1">{p.description}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#aaa]">
                      {done}/{myProjTasks.length} Done
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#777] pt-1 border-t border-[#222]">
                    <span>Target: {p.deadline || "Ongoing"}</span>
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#aaa] hover:text-white flex items-center gap-1"
                      >
                        GitHub <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {myProjects.length === 0 && (
              <p className="py-12 text-center text-xs text-[#666]">
                No projects assigned to your account yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
