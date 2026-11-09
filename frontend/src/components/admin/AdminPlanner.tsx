import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Flag,
  Milestone,
  Plus,
  Rocket,
  Shield,
  Tag,
  X,
} from "lucide-react";
import { PlannerEvent, Project } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  addAuditLog,
  addPlannerEvent,
  getStoredPlannerEvents,
} from "../../services/mockDataStore";

interface AdminPlannerProps {
  projects: Project[];
}

export const AdminPlanner: React.FC<AdminPlannerProps> = ({ projects }) => {
  const { user: currentUser } = useAuth();
  const [events, setEvents] = useState<PlannerEvent[]>(getStoredPlannerEvents);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<PlannerEvent["type"]>("MILESTONE");
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [isOrgWide, setIsOrgWide] = useState(true);
  const [desc, setDesc] = useState("");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const matchedProject = projects.find((p) => p.id === projectId);

    const created = addPlannerEvent({
      title: title.trim(),
      date,
      type,
      projectId,
      projectName: matchedProject ? matchedProject.name : undefined,
      isOrganizationWide: isOrgWide,
      description: desc.trim() || undefined,
    });

    setEvents(getStoredPlannerEvents());
    setShowCreateModal(false);
    setTitle("");
    setDate("");
    setDesc("");

    if (currentUser) {
      addAuditLog(
        currentUser,
        "PLANNER_EVENT_CREATED",
        "PlannerEvent",
        created.id,
        `Created organization milestone "${created.title}" for ${created.date}`
      );
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesType = typeFilter === "ALL" || e.type === typeFilter;
    const matchesProject =
      projectFilter === "ALL" || (e.projectId && String(e.projectId) === projectFilter);
    return matchesType && matchesProject;
  });

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Organization Planner & Timelines
          </h1>
          <p className="mt-1 text-xs text-[#888]">
            High-level release roadmaps, corporate milestones, scheduled reviews, and cross-project deadlines.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          <Plus size={15} /> Schedule Milestone
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#262626] bg-[#141414] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#777]">
            <Filter size={14} />
            <span>Filter by:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="RELEASE">Production Releases</option>
            <option value="DEADLINE">Project Deadlines</option>
            <option value="MILESTONE">Core Milestones</option>
            <option value="REVIEW">Scheduled Reviews</option>
          </select>

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
        </div>

        <span className="text-[11px] font-mono text-[#777]">
          {sortedEvents.length} SCHEDULED ITEMS
        </span>
      </div>

      {/* Timeline & Agenda Cards */}
      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const eventDate = new Date(event.date);
          const isPast = eventDate.getTime() < Date.now();

          return (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#262626] bg-[#141414] p-5 hover:border-[#383838] transition"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-base font-bold ${
                    event.type === "RELEASE"
                      ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-300"
                      : event.type === "DEADLINE"
                      ? "border-amber-900/60 bg-amber-950/20 text-amber-300"
                      : event.type === "REVIEW"
                      ? "border-neutral-700 bg-neutral-900/50 text-neutral-300"
                      : "border-[#333] bg-[#1b1b1b] text-white"
                  }`}
                >
                  {event.type === "RELEASE" ? (
                    <Rocket size={20} />
                  ) : event.type === "DEADLINE" ? (
                    <Clock size={20} />
                  ) : event.type === "REVIEW" ? (
                    <Shield size={20} />
                  ) : (
                    <Milestone size={20} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{event.title}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                        event.type === "RELEASE"
                          ? "bg-emerald-950/50 text-emerald-300 border border-emerald-900/60"
                          : event.type === "DEADLINE"
                          ? "bg-amber-950/50 text-amber-300 border border-amber-900/60"
                          : "bg-[#202020] text-[#aaa] border border-[#303030]"
                      }`}
                    >
                      {event.type}
                    </span>
                    {event.isOrganizationWide && (
                      <span className="rounded-md bg-[#252525] px-1.5 py-0.5 text-[9px] text-[#999]">
                        Org-Wide
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#777] leading-relaxed">
                    {event.description || "Organizational planning milestone."}
                  </p>

                  {event.projectName && (
                    <p className="text-[11px] text-[#888] pt-1">
                      Associated Project: <strong className="text-[#ccc]">{event.projectName}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-right sm:border-l sm:border-[#222] sm:pl-6">
                <div>
                  <p className="text-xs font-semibold text-white">
                    {eventDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-[#666] mt-0.5">
                    {isPast ? "Elapsed" : "Upcoming Scheduled"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {sortedEvents.length === 0 && (
          <div className="rounded-2xl border border-[#262626] bg-[#141414] p-12 text-center text-xs text-[#666]">
            No organizational milestones matching the filter.
          </div>
        )}
      </div>

      {/* Schedule Milestone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h3 className="text-base font-semibold text-white">Schedule Organizational Milestone</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#777] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Security Audit & Release Cutoff"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PlannerEvent["type"])}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="MILESTONE">Milestone</option>
                    <option value="RELEASE">Release</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="REVIEW">Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Associated Project (Optional)</label>
                <select
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                >
                  <option value="">Organization-wide / Not tied to single project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Description</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  placeholder="Details and deliverables required..."
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOrgWide}
                  onChange={(e) => setIsOrgWide(e.target.checked)}
                  className="rounded border-[#444] bg-transparent text-white"
                />
                Visible to all departments on organization agenda
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
