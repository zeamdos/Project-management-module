import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ListTodo,
  MessageSquare,
  Search,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface DeveloperTasksProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const DeveloperTasks: React.FC<DeveloperTasksProps> = ({
  tasks,
  onSelectTask,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user?.id);
  }, [tasks, user]);

  const filtered = useMemo(() => {
    return myTasks.filter((t) => {
      const matchSearch =
        `${t.title} ${t.description || ""} ${t.projectName || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [myTasks, search, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Assigned Tasks</h1>
        <p className="mt-1 text-xs text-[#888]">
          Complete catalog of deliverables assigned to you. Click any task to inspect criteria and discussion.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2">
          <Search size={15} className="text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
        <div className="divide-y divide-[#222]">
          {filtered.map((task) => {
            const isBlocked = task.status === "BLOCKED" || !!task.blocker;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="flex items-center justify-between p-4 hover:bg-[#181818] transition cursor-pointer gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#777]">TASK-{task.id}</span>
                    <span className="text-xs font-semibold text-white truncate">{task.title}</span>
                    {isBlocked && (
                      <span className="rounded bg-red-950/60 border border-red-900/60 px-1.5 py-0.2 text-[9px] font-bold text-red-300">
                        BLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#777] line-clamp-1">
                    {task.projectName} · {task.description || "No description"}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      task.status === "DONE"
                        ? "border-neutral-700 bg-neutral-900 text-neutral-300"
                        : task.status === "IN_REVIEW"
                        ? "border-amber-900/60 bg-amber-950/20 text-amber-300"
                        : "border-[#333] bg-[#1b1b1b] text-[#aaa]"
                    }`}
                  >
                    {task.status}
                  </span>
                  <span className="text-xs text-[#888] font-mono">
                    {task.dueDate || "No due date"}
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="py-16 text-center text-xs text-[#666]">
              No tasks match your filter criteria.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
