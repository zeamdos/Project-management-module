import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  GitPullRequest,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Task, TaskStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface DeveloperKanbanProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

const DEV_COLUMNS: { id: TaskStatus; title: string; hint: string }[] = [
  { id: "TODO", title: "To Do", hint: "Assigned tasks ready to start" },
  { id: "IN_PROGRESS", title: "In Progress", hint: "Currently under development" },
  { id: "IN_REVIEW", title: "In Review", hint: "Submitted for PM approval" },
  { id: "DONE", title: "Done", hint: "Approved by Project Manager" },
];

export const DeveloperKanban: React.FC<DeveloperKanbanProps> = ({
  tasks,
  onSelectTask,
  onUpdateTask,
}) => {
  const { user } = useAuth();

  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user?.id);
  }, [tasks, user]);

  const handleDevMove = (e: React.MouseEvent, task: Task, targetStatus: TaskStatus) => {
    e.stopPropagation();

    // Enforce business rule: Developer cannot self-approve to DONE
    if (targetStatus === "DONE") {
      alert("Only your Project Manager or designated reviewer can approve a task to Done. Move to 'In Review' to submit your work.");
      return;
    }

    const updated: Task = {
      ...task,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTask(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">My Kanban Board</h1>
        <p className="mt-1 text-xs text-[#888]">
          Your personal task pipeline. Move tasks to &ldquo;In Review&rdquo; when completed for PM code review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start min-h-[600px]">
        {DEV_COLUMNS.map((col) => {
          const colTasks = myTasks.filter((t) =>
            col.id === "IN_PROGRESS"
              ? t.status === "IN_PROGRESS" || t.status === "BLOCKED"
              : t.status === col.id
          );

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-2xl border border-[#262626] bg-[#121212] p-4 min-h-[500px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white">{col.title}</h3>
                    <span className="rounded-full bg-[#202020] px-2 py-0.5 text-[10px] font-bold text-[#aaa]">
                      {colTasks.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#666] mt-0.5">{col.hint}</p>
                </div>
              </div>

              <div className="flex-1 space-y-3 pt-3 overflow-y-auto">
                {colTasks.map((task) => {
                  const isBlocked = task.status === "BLOCKED" || (task.blocker && !task.blocker.resolved);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`group relative rounded-xl border p-4 space-y-3 transition cursor-pointer shadow-sm ${
                        isBlocked
                          ? "border-red-900/70 bg-[#1a1111]"
                          : "border-[#282828] bg-[#161616] hover:border-[#383838] hover:bg-[#191919]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#777]">TASK-{task.id}</span>
                        <div className="flex items-center gap-1.5">
                          {isBlocked && (
                            <span className="flex items-center gap-1 rounded bg-red-950/60 border border-red-900/60 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                              <AlertTriangle size={10} /> BLOCKED
                            </span>
                          )}
                          <span className="rounded bg-[#202020] px-1.5 py-0.5 text-[9px] text-[#888] uppercase">
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      <p className="text-[10px] text-[#777] truncate">
                        {task.projectName}
                      </p>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#242424] text-[11px] text-[#777]">
                        <span>Due: {task.dueDate || "None"}</span>
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px]">
                            <MessageSquare size={11} /> {task.comments.length}
                          </span>
                        )}
                      </div>

                      {/* Developer progression controls */}
                      <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-[#222]">
                        {col.id === "TODO" && (
                          <button
                            onClick={(e) => handleDevMove(e, task, "IN_PROGRESS")}
                            className="rounded-lg bg-[#252525] px-2.5 py-1 text-[10px] font-medium text-white hover:bg-[#333]"
                          >
                            Start Work →
                          </button>
                        )}
                        {col.id === "IN_PROGRESS" && (
                          <button
                            onClick={(e) => handleDevMove(e, task, "IN_REVIEW")}
                            className="rounded-lg bg-[#e2e2e2] px-2.5 py-1 text-[10px] font-semibold text-[#141414] hover:bg-white"
                          >
                            Submit for Review →
                          </button>
                        )}
                        {col.id === "IN_REVIEW" && (
                          <span className="text-[10px] text-[#777] italic">
                            Waiting on PM approval
                          </span>
                        )}
                        {col.id === "DONE" && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <CheckCircle2 size={11} /> Approved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#222] text-[11px] text-[#555]">
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
