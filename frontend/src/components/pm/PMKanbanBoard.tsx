import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  GitPullRequest,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { Project, Task, TaskPriority, TaskStatus, User } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface PMKanbanBoardProps {
  tasks: Task[];
  projects: Project[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onOpenCreateTask: (defaultStatus?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; countColor: string }[] = [
  { id: "BACKLOG", title: "Backlog", countColor: "bg-[#252525] text-[#888]" },
  { id: "TODO", title: "To Do", countColor: "bg-[#252525] text-[#aaa]" },
  { id: "IN_PROGRESS", title: "In Progress", countColor: "bg-neutral-800 text-neutral-200" },
  { id: "IN_REVIEW", title: "In Review", countColor: "bg-amber-950/40 text-amber-300" },
  { id: "DONE", title: "Done", countColor: "bg-neutral-800 text-white" },
];

export const PMKanbanBoard: React.FC<PMKanbanBoardProps> = ({
  tasks,
  projects,
  users,
  onSelectTask,
  onUpdateTask,
  onOpenCreateTask,
}) => {
  const { checkPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const canCreate = checkPermission("task.create");
  const canMove = checkPermission("task.change_status");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        `${t.title} ${t.description || ""} ${t.projectName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchProj =
        projectFilter === "ALL" || String(t.projectId) === projectFilter;
      const matchAssignee =
        assigneeFilter === "ALL" ||
        (assigneeFilter === "UNASSIGNED"
          ? !t.assigneeId
          : String(t.assigneeId) === assigneeFilter);
      const matchPriority =
        priorityFilter === "ALL" || t.priority === priorityFilter;

      return matchSearch && matchProj && matchAssignee && matchPriority;
    });
  }, [tasks, search, projectFilter, assigneeFilter, priorityFilter]);

  const handleMove = (e: React.MouseEvent, task: Task, direction: "prev" | "next") => {
    e.stopPropagation();
    const order: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    const currentIndex = order.indexOf(task.status === "BLOCKED" ? "IN_PROGRESS" : task.status);
    const targetIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < order.length) {
      const newStatus = order[targetIndex];
      const updated: Task = {
        ...task,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      onUpdateTask(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header & Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Project Kanban Board</h1>
          <p className="mt-1 text-xs text-[#888]">
            Interactive delivery pipeline across Backlog, To Do, In Progress, In Review, and Done.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => onOpenCreateTask("TODO")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            <Plus size={15} /> Add Task Card
          </button>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-4">
        <div className="flex flex-1 min-w-[200px] max-w-sm items-center gap-2 rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-1.5">
          <Search size={14} className="text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {users
              .filter((u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER")
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* 5-Column Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start min-h-[680px]">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) =>
            col.id === "IN_PROGRESS"
              ? t.status === "IN_PROGRESS" || t.status === "BLOCKED"
              : t.status === col.id
          );

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl border border-[#262626] bg-[#121212] p-3.5 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-white tracking-wide">{col.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${col.countColor}`}>
                    {colTasks.length}
                  </span>
                </div>
                {canCreate && (
                  <button
                    onClick={() => onOpenCreateTask(col.id)}
                    className="text-[#666] hover:text-white transition p-1"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 pt-3 overflow-y-auto">
                {colTasks.map((task) => {
                  const isBlocked = task.status === "BLOCKED" || (task.blocker && !task.blocker.resolved);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`group relative rounded-xl border p-4 space-y-3 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                        isBlocked
                          ? "border-red-900/70 bg-[#191010] hover:border-red-700"
                          : "border-[#282828] bg-[#161616] hover:border-[#3d3d3d] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {/* Top labels & priority */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#777]">
                          TASK-{task.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isBlocked && (
                            <span className="flex items-center gap-1 rounded bg-red-950/60 border border-red-900/60 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                              <AlertTriangle size={10} /> BLOCKED
                            </span>
                          )}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                              task.priority === "CRITICAL"
                                ? "bg-red-950/40 text-red-300 border border-red-900/50"
                                : task.priority === "HIGH"
                                ? "bg-amber-950/40 text-amber-300 border border-amber-900/50"
                                : "bg-[#222] text-[#888]"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Project Tag */}
                      <p className="text-[10px] text-[#777] truncate">
                        {task.projectName || "Enterprise Workspace"}
                      </p>

                      {/* Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, 2).map((l, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-[#202020] px-1.5 py-0.5 text-[9px] text-[#999]"
                            >
                              #{l}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer: Assignee & Meta */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#242424] text-[11px] text-[#777]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2a2a] text-[9px] font-bold text-white">
                            {task.assignee?.name ? task.assignee.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <span className="truncate max-w-[80px]">
                            {task.assignee?.name || "Unassigned"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[#777]">
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <MessageSquare size={11} /> {task.comments.length}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px]">{task.dueDate.slice(5)}</span>
                          )}
                        </div>
                      </div>

                      {/* Quick Move Buttons visible on hover */}
                      {canMove && (
                        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#333] shadow-lg z-10">
                          {col.id !== "BACKLOG" && (
                            <button
                              onClick={(e) => handleMove(e, task, "prev")}
                              className="p-1 text-[#888] hover:text-white"
                              title="Move column back"
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                          {col.id !== "DONE" && (
                            <button
                              onClick={(e) => handleMove(e, task, "next")}
                              className="p-1 text-[#888] hover:text-white"
                              title="Move column forward"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#242424] text-[11px] text-[#555]">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
