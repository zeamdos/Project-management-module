import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  GitPullRequest,
  MessageSquare,
  Shield,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { Task } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface PMReviewsProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

export const PMReviews: React.FC<PMReviewsProps> = ({
  tasks,
  onSelectTask,
  onUpdateTask,
}) => {
  const { user } = useAuth();
  const [reviewNote, setReviewNote] = useState<Record<number, string>>({});

  const pendingTasks = tasks.filter((t) => t.status === "IN_REVIEW");

  const handleDecision = (task: Task, decision: "APPROVE" | "CHANGES" | "REJECT") => {
    if (!user) return;
    const note = reviewNote[task.id] || "";
    const isApprove = decision === "APPROVE";
    const newStatus = isApprove ? "DONE" : "IN_PROGRESS";

    const updated: Task = {
      ...task,
      status: newStatus,
      comments: [
        ...(task.comments || []),
        {
          id: `comm-rev-${Date.now()}`,
          taskId: task.id,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          content: `[Code Review: ${decision}]: ${note.trim() || (isApprove ? "Approved" : "Requires revision")}`,
          createdAt: new Date().toISOString(),
        },
      ],
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user.id,
          actorName: user.name,
          action: `Review: ${decision}`,
          details: note.trim() || (isApprove ? "Moved to DONE" : "Returned to IN_PROGRESS"),
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setReviewNote((prev) => {
      const c = { ...prev };
      delete c[task.id];
      return c;
    });

    onUpdateTask(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Pending Code Reviews</h1>
        <p className="mt-1 text-xs text-[#888]">
          Review items submitted by developers. Approvals transition cards to Done, while revisions return them to In Progress.
        </p>
      </div>

      {pendingTasks.length > 0 ? (
        <div className="space-y-4">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#888]">TASK-{task.id}</span>
                    <span className="rounded bg-[#202020] px-2 py-0.5 text-[10px] text-[#aaa]">
                      {task.projectName}
                    </span>
                    <span className="rounded border border-amber-900/60 bg-amber-950/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      IN REVIEW
                    </span>
                  </div>
                  <h3
                    onClick={() => onSelectTask(task)}
                    className="text-base font-semibold text-white cursor-pointer hover:underline"
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-[#888] leading-relaxed">
                    {task.description || "No description provided."}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-[#777] block">Assigned Developer</span>
                  <span className="text-xs font-semibold text-white">
                    {task.assignee?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* GitHub Link if attached */}
              {task.githubPrUrl && (
                <div className="rounded-xl border border-[#262626] bg-[#181818] p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#ccc]">
                    <GitPullRequest size={15} className="text-neutral-400" />
                    <span>Pull Request: {task.githubPrUrl}</span>
                  </div>
                  <a
                    href={task.githubPrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#888] hover:text-white"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {/* Review Decision Input & Action Buttons */}
              <div className="pt-2 border-t border-[#222] space-y-3">
                <textarea
                  value={reviewNote[task.id] || ""}
                  onChange={(e) =>
                    setReviewNote({ ...reviewNote, [task.id]: e.target.value })
                  }
                  placeholder="Provide review feedback or approval notes..."
                  className="w-full rounded-xl border border-[#333] bg-[#101010] p-3 text-xs text-white outline-none focus:border-[#777]"
                  rows={2}
                />

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => onSelectTask(task)}
                    className="rounded-xl border border-[#333] px-3.5 py-2 text-xs text-[#888] hover:bg-[#202020] hover:text-white"
                  >
                    Inspect Full Details
                  </button>
                  <button
                    onClick={() => handleDecision(task, "CHANGES")}
                    className="rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 transition"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleDecision(task, "APPROVE")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#e5e5e5] px-4 py-2 text-xs font-semibold text-[#141414] hover:bg-white transition"
                  >
                    <CheckCircle2 size={14} /> Approve & Done
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-16 text-center text-xs text-[#666]">
          No work items currently waiting in the review queue.
        </div>
      )}
    </div>
  );
};
