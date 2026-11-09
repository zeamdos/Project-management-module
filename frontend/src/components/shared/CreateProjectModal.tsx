import React, { useState } from "react";
import { AlertCircle, FolderKanban, Sparkles, X } from "lucide-react";
import API from "../../services/api";
import { Project } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { addAuditLog } from "../../services/mockDataStore";

interface CreateProjectModalProps {
  onClose: () => void;
  onProjectCreated: (newProject: Project, newTasks?: any[]) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onProjectCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [updateIntervalDays, setUpdateIntervalDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call backend POST /projects
      const res = await API.post("/projects", {
        name: name.trim(),
        description: description.trim(),
        techStack: techStack.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        deadline: deadline || undefined,
        updateIntervalDays,
      });

      const created: Project = res.data?.project || {
        id: res.data?.id || Date.now(),
        name: name.trim(),
        description: description.trim(),
        techStack: techStack.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        deadline: deadline || undefined,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      if (user) {
        addAuditLog(user, "PROJECT_CREATED", "Project", created.id, `Created project "${created.name}"`);
      }

      onProjectCreated(created, res.data?.tasks);
      onClose();
    } catch (err: any) {
      // If backend offline, create local project cleanly
      const fallbackProject: Project = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        techStack: techStack.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        deadline: deadline || undefined,
        status: "ACTIVE",
        pmId: user?.id,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        addAuditLog(user, "PROJECT_CREATED", "Project", fallbackProject.id, `Created project "${fallbackProject.name}" (local fallback)`);
      }

      onProjectCreated(fallbackProject);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#202020] border border-[#333] text-white">
              <FolderKanban size={17} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Launch New Project</h3>
              <p className="text-xs text-[#888]">Define project specifications, scope, and target deadline.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-xs text-red-300">
            <AlertCircle size={15} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Security Gateway"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Scope & Technical Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail technical goals and architecture..."
              className="w-full rounded-xl border border-[#333] bg-[#101010] p-3 text-xs text-white outline-none focus:border-[#777] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Tech Stack</label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Node.js, SQLite"
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Deadline Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">GitHub Repository URL (Optional)</label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/organization/repo"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white disabled:opacity-50 transition"
            >
              {loading ? "Deploying..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
