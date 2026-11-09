import React from "react";
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Download,
  FolderKanban,
  PieChart,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { Project, Task, User } from "../../types";

interface ReportsAnalyticsProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  projects,
  tasks,
  users,
}) => {
  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const inReviewTasks = tasks.filter((t) => t.status === "IN_REVIEW");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "DONE" || !t.dueDate) return false;
    return new Date(t.dueDate).getTime() < Date.now();
  });

  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const handleExportSummary = () => {
    const summary = [
      "ORGANIZATION PERFORMANCE EXECUTIVE REPORT",
      `Generated: ${new Date().toISOString()}`,
      "",
      `Total Users: ${users.length}`,
      `Total Projects: ${projects.length}`,
      `Total Tasks: ${tasks.length}`,
      `Completed Tasks: ${completedTasks.length}`,
      `In Progress Tasks: ${inProgressTasks.length}`,
      `In Review Tasks: ${inReviewTasks.length}`,
      `Blocked Tasks: ${blockedTasks.length}`,
      `Overdue Tasks: ${overdueTasks.length}`,
      `Organization Completion Velocity: ${completionRate}%`,
      "",
      "PROJECT BREAKDOWN:",
      ...projects.map((p) => {
        const pTasks = tasks.filter((t) => t.projectId === p.id);
        const pDone = pTasks.filter((t) => t.status === "DONE").length;
        const pRate = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
        return `${p.name}: ${pDone}/${pTasks.length} tasks completed (${pRate}%) - Status: ${p.status || "ACTIVE"}`;
      }),
    ].join("\n");

    const blob = new Blob([summary], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `executive-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reports & Analytics</h1>
          <p className="mt-1 text-xs text-[#888]">
            Organizational velocity, delivery timelines, bottleneck analysis, and resource utilization.
          </p>
        </div>
        <button
          onClick={handleExportSummary}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          <Download size={14} /> Export Executive Summary
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <span className="text-xs text-[#777]">Completion Velocity</span>
          <p className="mt-2 text-3xl font-bold text-white">{completionRate}%</p>
          <p className="mt-2 text-[11px] text-[#888]">{completedTasks.length} of {tasks.length} total tasks delivered</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <span className="text-xs text-[#777]">In-Flight Execution</span>
          <p className="mt-2 text-3xl font-bold text-white">{inProgressTasks.length + inReviewTasks.length}</p>
          <p className="mt-2 text-[11px] text-[#888]">{inReviewTasks.length} currently awaiting PM review</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <span className="text-xs text-[#777]">Escalated Blockers</span>
          <p className="mt-2 text-3xl font-bold text-red-400">{blockedTasks.length}</p>
          <p className="mt-2 text-[11px] text-[#888]">Requiring dependency clearance</p>
        </div>

        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
          <span className="text-xs text-[#777]">Overdue Targets</span>
          <p className="mt-2 text-3xl font-bold text-amber-400">{overdueTasks.length}</p>
          <p className="mt-2 text-[11px] text-[#888]">Missed estimated deadline date</p>
        </div>
      </div>

      {/* Project Delivery Breakdown */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Project Delivery Performance</h2>
          <p className="text-xs text-[#777] mt-0.5">Task completion distribution and health status per project</p>
        </div>

        <div className="space-y-5">
          {projects.map((project) => {
            const pTasks = tasks.filter((t) => t.projectId === project.id);
            const pDone = pTasks.filter((t) => t.status === "DONE").length;
            const pInProgress = pTasks.filter((t) => t.status === "IN_PROGRESS").length;
            const pReview = pTasks.filter((t) => t.status === "IN_REVIEW").length;
            const pBlocked = pTasks.filter((t) => t.status === "BLOCKED").length;
            const pRate = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <div key={project.id} className="rounded-xl border border-[#262626] bg-[#171717] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                    <p className="text-xs text-[#777] mt-0.5">{pTasks.length} total tasks · Target: {project.deadline || "Ongoing"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-white">{pRate}%</span>
                    <span className="rounded-md border border-[#333] bg-[#202020] px-2 py-0.5 text-[10px] text-[#aaa]">
                      {project.status || "ACTIVE"}
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[#242424] flex">
                  <div style={{ width: `${pTasks.length ? (pDone / pTasks.length) * 100 : 0}%` }} className="bg-neutral-200" title="Done" />
                  <div style={{ width: `${pTasks.length ? (pReview / pTasks.length) * 100 : 0}%` }} className="bg-neutral-400" title="In Review" />
                  <div style={{ width: `${pTasks.length ? (pInProgress / pTasks.length) * 100 : 0}%` }} className="bg-neutral-600" title="In Progress" />
                  <div style={{ width: `${pTasks.length ? (pBlocked / pTasks.length) * 100 : 0}%` }} className="bg-red-800" title="Blocked" />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#777] pt-1">
                  <span>Done: <strong className="text-[#ccc]">{pDone}</strong></span>
                  <span>In Review: <strong className="text-[#ccc]">{pReview}</strong></span>
                  <span>In Progress: <strong className="text-[#ccc]">{pInProgress}</strong></span>
                  <span>Blocked: <strong className="text-red-400">{pBlocked}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Stage Distribution */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Organization Workflow Stage Distribution</h2>
          <p className="text-xs text-[#777] mt-0.5">Overall task balance across five standard Kanban columns</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-5 pt-2">
          {[
            { label: "Backlog", count: tasks.filter((t) => t.status === "BACKLOG").length },
            { label: "To Do", count: tasks.filter((t) => t.status === "TODO").length },
            { label: "In Progress", count: inProgressTasks.length },
            { label: "In Review", count: inReviewTasks.length },
            { label: "Done", count: completedTasks.length },
          ].map((col) => (
            <div key={col.label} className="rounded-xl border border-[#262626] bg-[#171717] p-4 text-center">
              <span className="text-[11px] uppercase tracking-wider text-[#777]">{col.label}</span>
              <p className="mt-2 text-2xl font-bold text-white">{col.count}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
