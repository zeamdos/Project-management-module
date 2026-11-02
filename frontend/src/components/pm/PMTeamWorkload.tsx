import React from "react";
import { AlertCircle, AlertTriangle, Briefcase, CheckCircle2, Clock, Users } from "lucide-react";
import { Task, User } from "../../types";

interface PMTeamWorkloadProps {
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
}

export const PMTeamWorkload: React.FC<PMTeamWorkloadProps> = ({
  tasks,
  users,
  onSelectTask,
}) => {
  const developers = users.filter(
    (u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER"
  );

  const unassignedTasks = tasks.filter((t) => !t.assigneeId && t.status !== "DONE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Team Workload & Allocation</h1>
        <p className="mt-1 text-xs text-[#888]">
          Monitor developer capacity, balance open assignments, and ensure unassigned tasks are claimed.
        </p>
      </div>

      {/* Unassigned Work Alert */}
      {unassignedTasks.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400" size={18} />
            <div>
              <p className="text-xs font-semibold text-amber-200">
                {unassignedTasks.length} Unassigned Active Work Items
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Tasks need a designated owner to prevent delivery delays.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Developers Workload Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {developers.map((dev) => {
          const devTasks = tasks.filter((t) => t.assigneeId === dev.id);
          const inProgress = devTasks.filter((t) => t.status === "IN_PROGRESS").length;
          const inReview = devTasks.filter((t) => t.status === "IN_REVIEW").length;
          const blocked = devTasks.filter((t) => t.status === "BLOCKED").length;
          const done = devTasks.filter((t) => t.status === "DONE").length;
          const open = devTasks.filter((t) => t.status !== "DONE");

          return (
            <div
              key={dev.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#222] border border-[#333] text-sm font-bold text-white">
                    {dev.avatar || dev.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{dev.name}</h3>
                    <p className="text-xs text-[#777] mt-0.5">
                      {dev.team || "Engineering"} · {dev.specialty || "Developer"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-white">{open.length}</span>
                  <span className="text-[11px] text-[#777] block">active tasks</span>
                </div>
              </div>

              {/* Workload metric badges */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#222] text-center text-xs">
                <div className="rounded-lg bg-[#181818] p-2">
                  <span className="text-[10px] text-[#777] uppercase block">Active</span>
                  <span className="font-semibold text-white">{inProgress}</span>
                </div>
                <div className="rounded-lg bg-[#181818] p-2">
                  <span className="text-[10px] text-[#777] uppercase block">Review</span>
                  <span className="font-semibold text-amber-300">{inReview}</span>
                </div>
                <div className="rounded-lg bg-[#181818] p-2">
                  <span className="text-[10px] text-[#777] uppercase block">Blocked</span>
                  <span className="font-semibold text-red-400">{blocked}</span>
                </div>
                <div className="rounded-lg bg-[#181818] p-2">
                  <span className="text-[10px] text-[#777] uppercase block">Done</span>
                  <span className="font-semibold text-[#888]">{done}</span>
                </div>
              </div>

              {/* Task list preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#888] uppercase tracking-wider block">
                  Current Assignments
                </span>
                {open.length > 0 ? (
                  open.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#171717] px-3 py-2 text-xs hover:bg-[#1f1f1f] transition cursor-pointer"
                    >
                      <span className="text-[#ccc] truncate max-w-[240px]">{t.title}</span>
                      <span className="text-[10px] uppercase text-[#777]">{t.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#555] py-2">No active tasks assigned.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
