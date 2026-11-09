import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Flag,
  Milestone,
  Rocket,
} from "lucide-react";
import { PlannerEvent, Project, Task } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getStoredPlannerEvents, saveStoredPlannerEvents } from "../../services/mockDataStore";
import { fetchPlannerEventsList } from "../../services/apiClient";

interface RoleAwarePlannerProps {
  tasks: Task[];
  projects: Project[];
  onSelectTask?: (task: Task) => void;
}

export const RoleAwarePlanner: React.FC<RoleAwarePlannerProps> = ({
  tasks,
  projects,
  onSelectTask,
}) => {
  const { user } = useAuth();
  const role = (user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isPM = role === "MANAGER" || role === "PROJECT_MANAGER";
  const isDev = role === "DEVELOPER" || role === "SENIOR_DEVELOPER";

  const [plannerEvents, setPlannerEvents] = useState<PlannerEvent[]>(() => getStoredPlannerEvents());
  const [loading, setLoading] = useState(true);

  // Try to fetch planner events from the backend on mount
  useState(() => {
    fetchPlannerEventsList()
      .then((res) => {
        const data = res.data || res;
        const events: PlannerEvent[] = Array.isArray(data) ? data : (data.events || []);
        setPlannerEvents(events);
        saveStoredPlannerEvents(events);
      })
      .catch(() => {
        // Keep local fallback if backend is not ready
      })
      .finally(() => setLoading(false));
  });

  const allOrgEvents = plannerEvents;

  // Role-scoped items:
  // Admin: Sees all organizational milestones + all project deadlines
  // PM: Sees projects they manage + their tasks + org-wide milestones
  // Dev: ONLY sees their assigned tasks + org-wide public milestones (no private calendars of peers!)
  const visibleItems = useMemo(() => {
    const list: {
      id: string;
      title: string;
      date: string;
      type: "TASK" | "MILESTONE" | "RELEASE" | "REVIEW";
      sourceName?: string;
      status?: string;
      taskRef?: Task;
    }[] = [];

    // 1. Add Org Milestones (everyone sees isOrganizationWide; Admins/PMs see project-specific ones)
    allOrgEvents.forEach((e) => {
      if (isAdmin || e.isOrganizationWide) {
        list.push({
          id: `ev-${e.id}`,
          title: e.title,
          date: e.date,
          type: e.type === "RELEASE" ? "RELEASE" : e.type === "REVIEW" ? "REVIEW" : "MILESTONE",
          sourceName: e.projectName || "Organization",
        });
      } else if (isPM && e.projectId) {
        const managed = projects.filter((p) => p.pmId === user?.id || !p.pmId).map((p) => p.id);
        if (managed.includes(e.projectId)) {
          list.push({
            id: `ev-${e.id}`,
            title: e.title,
            date: e.date,
            type: "MILESTONE",
            sourceName: e.projectName,
          });
        }
      }
    });

    // 2. Add Task Deadlines based strictly on role privacy
    tasks.forEach((t) => {
      if (!t.dueDate) return;

      if (isAdmin) {
        list.push({
          id: `task-${t.id}`,
          title: t.title,
          date: t.dueDate,
          type: "TASK",
          sourceName: `${t.projectName} (${t.assignee?.name || "Unassigned"})`,
          status: t.status,
          taskRef: t,
        });
      } else if (isPM) {
        const managed = projects.filter((p) => p.pmId === user?.id || !p.pmId).map((p) => p.id);
        if (managed.includes(t.projectId)) {
          list.push({
            id: `task-${t.id}`,
            title: t.title,
            date: t.dueDate,
            type: "TASK",
            sourceName: `${t.projectName} (${t.assignee?.name || "Unassigned"})`,
            status: t.status,
            taskRef: t,
          });
        }
      } else if (isDev) {
        // Developer ONLY sees tasks assigned to themselves
        if (t.assigneeId === user?.id) {
          list.push({
            id: `task-${t.id}`,
            title: t.title,
            date: t.dueDate,
            type: "TASK",
            sourceName: t.projectName,
            status: t.status,
            taskRef: t,
          });
        }
      }
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allOrgEvents, tasks, projects, user, isAdmin, isPM, isDev]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {isAdmin ? "Organization Delivery Timeline" : isPM ? "Project Delivery Planner" : "My Personal Schedule"}
        </h1>
        <p className="mt-1 text-xs text-[#888]">
          {isAdmin
            ? "Executive calendar tracking organizational releases, audit reviews, and all team deliverables."
            : isPM
            ? "Project milestone and deadline timeline for initiatives authorized under your management."
            : "Your personal assignment schedule and deadline targets. Private calendars of colleagues are protected."}
        </p>
      </div>

      {/* Agenda Timeline List */}
      <div className="space-y-3">
        {visibleItems.map((item) => {
          const itemDate = new Date(item.date);
          const isElapsed = itemDate.getTime() < Date.now();

          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.taskRef && onSelectTask) onSelectTask(item.taskRef);
              }}
              className={`flex items-center justify-between rounded-xl border border-[#262626] bg-[#141414] p-4 transition ${
                item.taskRef ? "cursor-pointer hover:bg-[#1a1a1a]" : ""
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs ${
                    item.type === "RELEASE"
                      ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-300"
                      : item.type === "REVIEW"
                      ? "border-neutral-700 bg-neutral-900 text-neutral-300"
                      : item.type === "MILESTONE"
                      ? "border-[#383838] bg-[#1e1e1e] text-white"
                      : "border-[#2d2d2d] bg-[#181818] text-[#aaa]"
                  }`}
                >
                  {item.type === "RELEASE" ? (
                    <Rocket size={15} />
                  ) : item.type === "REVIEW" ? (
                    <Clock size={15} />
                  ) : item.type === "MILESTONE" ? (
                    <Milestone size={15} />
                  ) : (
                    <CalendarDays size={15} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase ${
                        item.type === "RELEASE"
                          ? "bg-emerald-950/40 text-emerald-300"
                          : item.type === "TASK"
                          ? "bg-[#222] text-[#999]"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#777] mt-0.5 truncate">{item.sourceName}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-white">
                  {itemDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span className="block text-[10px] text-[#666]">
                  {isElapsed ? "Elapsed" : "Upcoming"}
                </span>
              </div>
            </div>
          );
        })}

        {visibleItems.length === 0 && (
          <p className="py-16 text-center text-xs text-[#666]">
            No dated schedule items in your view.
          </p>
        )}
      </div>
    </div>
  );
};
