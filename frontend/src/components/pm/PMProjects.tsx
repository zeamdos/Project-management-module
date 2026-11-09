import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderKanban,
  GitBranch,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Project, Task } from "../../types";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

interface PMProjectsProps {
  projects: Project[];
  tasks: Task[];
  onRefreshProjects: () => void;
  onOpenCreateModal: () => void;
}

export const PMProjects: React.FC<PMProjectsProps> = ({
  projects,
  tasks,
  onRefreshProjects,
  onOpenCreateModal,
}) => {
  const { user, checkPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const canCreate = checkPermission("project.create");
  const canEdit = checkPermission("project.edit");

  const filtered = projects.filter((p) =>
    `${p.name} ${p.description || ""} ${p.techStack || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Project Management</h1>
          <p className="mt-1 text-xs text-[#888]">
            Directory of organizational initiatives, technical scopes, repositories, and delivery progress.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            <Plus size={15} /> Launch New Project
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#262626] bg-[#141414] px-4 py-3">
        <Search size={15} className="text-[#666]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter projects by title, description, or tech stack..."
          className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666]"
        />
      </div>

      {/* Projects Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((proj) => {
          const projTasks = tasks.filter((t) => t.projectId === proj.id);
          const done = projTasks.filter((t) => t.status === "DONE").length;
          const pct = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;
          const blocked = projTasks.filter((t) => t.status === "BLOCKED").length;

          return (
            <div
              key={proj.id}
              className="flex flex-col justify-between rounded-2xl border border-[#262626] bg-[#141414] p-5 hover:border-[#383838] transition space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#333] bg-[#202020] text-white">
                    <FolderKanban size={18} />
                  </div>
                  <span className="rounded-md border border-[#303030] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-semibold text-[#aaa] uppercase">
                    {proj.status || "ACTIVE"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                  <p className="mt-1 text-xs text-[#777] line-clamp-2 leading-relaxed">
                    {proj.description || "Active engineering project."}
                  </p>
                </div>

                {proj.techStack && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                    <GitBranch size={13} className="text-[#666]" />
                    <span className="truncate">{proj.techStack}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar & Stats */}
              <div className="space-y-2 pt-3 border-t border-[#222]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#777]">Completion</span>
                  <span className="font-mono text-white font-semibold">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#242424]">
                  <div
                    className="h-full rounded-full bg-neutral-300 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#777] pt-1">
                  <span>{projTasks.length} tasks</span>
                  {blocked > 0 ? (
                    <span className="text-red-400 font-semibold">{blocked} blocked</span>
                  ) : (
                    <span>Deadline: {proj.deadline || "Ongoing"}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
