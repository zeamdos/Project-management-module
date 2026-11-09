import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitPullRequest,
  MessageSquare,
  Send,
  ShieldAlert,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import { Task, TaskPriority, TaskStatus, User } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  allUsers: User[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateTask,
  allUsers,
}) => {
  const { user, checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">("details");
  const [commentText, setCommentText] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [showBlockerInput, setShowBlockerInput] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [showReviewInput, setShowReviewInput] = useState<"APPROVE" | "CHANGES" | null>(null);

  if (!task) return null;

  const canEdit = checkPermission("task.edit", { assigneeId: task.assigneeId ?? undefined });
  const canAssign = checkPermission("task.assign");
  const canChangeStatus = checkPermission("task.change_status", { assigneeId: task.assigneeId ?? undefined });
  const isPM = ["ADMIN", "MANAGER", "PROJECT_MANAGER"].includes((user?.role || "").toUpperCase());
  const isAssignee = task.assigneeId === user?.id;

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updated: Task = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user?.id || 0,
          actorName: user?.name || "User",
          action: "Status Updated",
          details: `Moved from ${task.status} to ${newStatus}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    onUpdateTask(updated);
  };

  const handleAssigneeChange = (assigneeId: number) => {
    const selectedUser = allUsers.find((u) => u.id === assigneeId);
    if (!selectedUser) return;

    const updated: Task = {
      ...task,
      assigneeId: selectedUser.id,
      assignee: {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        avatar: selectedUser.avatar,
        specialty: selectedUser.specialty,
      },
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user?.id || 0,
          actorName: user?.name || "User",
          action: "Reassigned Task",
          details: `Reassigned to ${selectedUser.name}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    onUpdateTask(updated);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      taskId: task.id,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorAvatar: user.avatar,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      comments: [...(task.comments || []), newComment],
    };

    setCommentText("");
    onUpdateTask(updated);
  };

  const handleReportBlocker = () => {
    if (!blockerText.trim() || !user) return;

    const blocker = {
      id: `blk-${Date.now()}`,
      taskId: task.id,
      reporterId: user.id,
      reporterName: user.name,
      description: blockerText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    const updated: Task = {
      ...task,
      status: "BLOCKED",
      blocker,
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user.id,
          actorName: user.name,
          action: "Blocker Reported",
          details: blockerText.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setBlockerText("");
    setShowBlockerInput(false);
    onUpdateTask(updated);
  };

  const handleResolveBlocker = () => {
    if (!user) return;

    const updated: Task = {
      ...task,
      status: "IN_PROGRESS",
      blocker: null,
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user.id,
          actorName: user.name,
          action: "Blocker Resolved",
          details: `Blocker marked resolved by ${user.name}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    onUpdateTask(updated);
  };

  const handleReviewDecision = (decision: "APPROVE" | "CHANGES") => {
    if (!user) return;

    const isApprove = decision === "APPROVE";
    const newStatus: TaskStatus = isApprove ? "DONE" : "IN_PROGRESS";

    const updated: Task = {
      ...task,
      status: newStatus,
      comments: reviewNote.trim()
        ? [
            ...(task.comments || []),
            {
              id: `comm-rev-${Date.now()}`,
              taskId: task.id,
              authorId: user.id,
              authorName: user.name,
              authorRole: user.role,
              content: `[Code Review ${isApprove ? "Approved" : "Changes Requested"}]: ${reviewNote.trim()}`,
              createdAt: new Date().toISOString(),
            },
          ]
        : task.comments,
      activity: [
        ...(task.activity || []),
        {
          id: `act-${Date.now()}`,
          taskId: task.id,
          actorId: user.id,
          actorName: user.name,
          action: isApprove ? "Review Approved" : "Changes Requested",
          details: reviewNote.trim() || (isApprove ? "Approved to DONE" : "Returned to IN_PROGRESS"),
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setShowReviewInput(null);
    setReviewNote("");
    onUpdateTask(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#2d2d2d] bg-[#141414] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#262626] p-6 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#333] bg-[#1a1a1a] px-2 py-0.5 text-[11px] font-mono text-[#aaa]">
                TASK-{task.id}
              </span>
              <span className="text-xs text-[#888]">in</span>
              <span className="rounded-md bg-[#202020] px-2 py-0.5 text-xs font-medium text-[#ddd]">
                {task.projectName || "General Project"}
              </span>
              {task.teamName && (
                <span className="rounded-md border border-[#2e2e2e] bg-[#181818] px-2 py-0.5 text-[11px] text-[#999]">
                  {task.teamName}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-white tracking-tight pt-1">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#777] transition hover:bg-[#202020] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Blocker Alert Banner if active */}
        {task.blocker && !task.blocker.resolved && (
          <div className="mx-6 mt-4 flex items-start justify-between gap-4 rounded-xl border border-red-900/60 bg-red-950/20 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 text-red-400 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-red-300">
                  Active Blocker Reported by {task.blocker.reporterName}
                </p>
                <p className="mt-1 text-xs text-red-200/90 leading-relaxed">
                  {task.blocker.description}
                </p>
              </div>
            </div>
            {isPM && (
              <button
                onClick={handleResolveBlocker}
                className="shrink-0 rounded-lg border border-red-800 bg-red-900/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-900"
              >
                Mark Resolved
              </button>
            )}
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#242424] px-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition ${
              activeTab === "details"
                ? "border-white text-white"
                : "border-transparent text-[#777] hover:text-[#bbb]"
            }`}
          >
            Overview & Scope
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition ${
              activeTab === "comments"
                ? "border-white text-white"
                : "border-transparent text-[#777] hover:text-[#bbb]"
            }`}
          >
            <MessageSquare size={14} />
            <span>Discussion ({task.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`border-b-2 px-4 py-3 text-xs font-medium transition ${
              activeTab === "activity"
                ? "border-white text-white"
                : "border-transparent text-[#777] hover:text-[#bbb]"
            }`}
          >
            Audit & History
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "details" && (
            <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
              {/* Left Column: Description & Acceptance Criteria */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777] mb-2">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed text-[#ccc] bg-[#181818] p-4 rounded-xl border border-[#262626]">
                    {task.description || "No description provided for this work item."}
                  </p>
                </div>

                {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777] mb-2">
                      Acceptance Criteria
                    </h4>
                    <div className="space-y-2 rounded-xl border border-[#262626] bg-[#181818] p-4">
                      {task.acceptanceCriteria.map((criterion, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-[#bbb]">
                          <CheckCircle2 size={15} className="mt-0.5 text-neutral-400 shrink-0" />
                          <span>{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub integration links */}
                {(task.githubPrUrl || task.githubRepoUrl) && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777] mb-2">
                      Repository & Pull Requests
                    </h4>
                    <div className="flex flex-col gap-2 rounded-xl border border-[#262626] bg-[#181818] p-4 text-xs">
                      {task.githubPrUrl && (
                        <a
                          href={task.githubPrUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-[#aaa] hover:text-white transition"
                        >
                          <GitPullRequest size={15} className="text-neutral-400" />
                          <span className="truncate">{task.githubPrUrl}</span>
                          <ExternalLink size={13} className="ml-auto text-[#666]" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Developer Actions (Submit for review / Report blocker) */}
                <div className="pt-2 border-t border-[#262626] flex flex-wrap gap-3">
                  {isAssignee && task.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange("IN_REVIEW")}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#e2e2e2] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
                    >
                      <CheckCircle2 size={15} /> Submit for Code Review
                    </button>
                  )}

                  {isAssignee && task.status !== "BLOCKED" && (
                    <button
                      onClick={() => setShowBlockerInput((s) => !s)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-2.5 text-xs font-medium text-red-300 hover:bg-red-950/40 transition"
                    >
                      <AlertTriangle size={15} /> Report Blocker
                    </button>
                  )}

                  {/* PM Review actions if in review */}
                  {isPM && task.status === "IN_REVIEW" && (
                    <div className="w-full space-y-3 rounded-xl border border-[#333] bg-[#1a1a1a] p-4">
                      <p className="text-xs font-semibold text-white">Project Manager Review Action</p>
                      <p className="text-xs text-[#888]">
                        Work has been submitted by developer. Review code changes and approve or request revision.
                      </p>
                      {showReviewInput ? (
                        <div className="space-y-3 pt-2">
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add review feedback notes for developer..."
                            className="w-full rounded-lg border border-[#353535] bg-[#111] p-3 text-xs text-white outline-none focus:border-[#777]"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewDecision(showReviewInput)}
                              className="rounded-lg bg-[#e2e2e2] px-3.5 py-2 text-xs font-semibold text-[#141414]"
                            >
                              Confirm {showReviewInput === "APPROVE" ? "Approval" : "Changes"}
                            </button>
                            <button
                              onClick={() => setShowReviewInput(null)}
                              className="rounded-lg border border-[#333] px-3 py-2 text-xs text-[#888]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => setShowReviewInput("APPROVE")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#e2e2e2] px-3.5 py-2 text-xs font-semibold text-[#141414] hover:bg-white transition"
                          >
                            <CheckCircle2 size={14} /> Approve & Done
                          </button>
                          <button
                            onClick={() => setShowReviewInput("CHANGES")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#383838] px-3.5 py-2 text-xs font-medium text-[#ccc] hover:bg-[#252525] transition"
                          >
                            Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blocker input expansion */}
                  {showBlockerInput && (
                    <div className="w-full space-y-3 rounded-xl border border-red-900/60 bg-[#1e1515] p-4">
                      <p className="text-xs font-semibold text-red-300">Describe What Is Blocking You</p>
                      <textarea
                        value={blockerText}
                        onChange={(e) => setBlockerText(e.target.value)}
                        placeholder="Detail dependency missing, API issue, or environment credentials needed..."
                        className="w-full rounded-lg border border-red-900/50 bg-[#100a0a] p-3 text-xs text-white outline-none focus:border-red-600"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReportBlocker}
                          className="rounded-lg bg-red-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Alert PM & Flag Task
                        </button>
                        <button
                          onClick={() => setShowBlockerInput(false)}
                          className="rounded-lg border border-[#333] px-3 py-2 text-xs text-[#888]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Metadata & Controls */}
              <div className="space-y-4 rounded-xl border border-[#242424] bg-[#161616] p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777]">
                  Task Attributes
                </h4>

                {/* Status Selector */}
                <div>
                  <label className="text-[11px] text-[#777] block mb-1.5">Workflow Status</label>
                  {canChangeStatus ? (
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                      className="w-full rounded-lg border border-[#333] bg-[#101010] px-3 py-2 text-xs font-medium text-white outline-none focus:border-[#666]"
                    >
                      <option value="BACKLOG">Backlog</option>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      {isPM && <option value="DONE">Done</option>}
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  ) : (
                    <span className="inline-block rounded-md border border-[#303030] bg-[#1a1a1a] px-3 py-1.5 text-xs font-medium text-[#ccc]">
                      {task.status}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-[11px] text-[#777] block mb-1.5">Priority Level</label>
                  <span
                    className={`inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${
                      task.priority === "CRITICAL"
                        ? "border-red-900/60 bg-red-950/20 text-red-300"
                        : task.priority === "HIGH"
                        ? "border-amber-900/60 bg-amber-950/20 text-amber-300"
                        : "border-[#333] bg-[#1a1a1a] text-[#aaa]"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-[11px] text-[#777] block mb-1.5">Assigned Developer</label>
                  {canAssign ? (
                    <select
                      value={task.assigneeId || ""}
                      onChange={(e) => handleAssigneeChange(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#333] bg-[#101010] px-3 py-2 text-xs font-medium text-white outline-none focus:border-[#666]"
                    >
                      <option value="">Unassigned</option>
                      {allUsers
                        .filter((u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER")
                        .map((dev) => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name} {dev.specialty ? `(${dev.specialty})` : ""}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#121212] p-2 text-xs text-[#ccc]">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2a2a] text-[10px] font-semibold text-white">
                        {task.assignee?.name ? task.assignee.name.slice(0, 2).toUpperCase() : "U"}
                      </div>
                      <span>{task.assignee?.name || "Unassigned"}</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#242424]">
                  <div>
                    <span className="text-[10px] uppercase text-[#666] block">Start Date</span>
                    <span className="text-xs text-[#bbb] mt-1 block">
                      {task.startDate || "Not set"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#666] block">Due Date</span>
                    <span className="text-xs text-[#bbb] mt-1 block">
                      {task.dueDate || "No deadline"}
                    </span>
                  </div>
                </div>

                {/* Required skill */}
                {task.requiredSkill && (
                  <div className="pt-2 border-t border-[#242424]">
                    <span className="text-[10px] uppercase text-[#666] block mb-1">Required Skills</span>
                    <span className="rounded-md border border-[#303030] bg-[#1a1a1a] px-2.5 py-1 text-xs text-[#aaa]">
                      {task.requiredSkill}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share an update or ask a question..."
                  className="flex-1 rounded-xl border border-[#333] bg-[#171717] px-4 py-3 text-xs text-white outline-none focus:border-[#777]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#e2e2e2] px-5 py-3 text-xs font-semibold text-[#141414] hover:bg-white disabled:opacity-50 transition"
                >
                  <Send size={14} /> Send
                </button>
              </form>

              {/* Discussion List */}
              <div className="space-y-4">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2a2a] text-[10px] font-semibold text-white">
                            {comment.authorAvatar || comment.authorName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white">
                              {comment.authorName}
                            </span>
                            <span className="ml-2 text-[10px] text-[#777] uppercase">
                              {comment.authorRole}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#666]">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-[#ccc] pl-9">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-12 text-center text-xs text-[#666]">
                    No discussions on this task yet. Leave a note above to collaborate.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              {task.activity && task.activity.length > 0 ? (
                <div className="divide-y divide-[#222]">
                  {task.activity.map((act) => (
                    <div key={act.id} className="py-3 flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-neutral-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#eee]">{act.action}</span>
                          <span className="text-[10px] text-[#666]">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#888] mt-0.5">
                          by <span className="text-[#ccc]">{act.actorName}</span>
                          {act.details && ` · ${act.details}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-xs text-[#666]">
                  No logged activity records yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
