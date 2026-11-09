import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface CommitActivity {
  id: string | number;
  type: string;
  hash: string;
  message: string;
  url?: string;
  taskId?: number;
  createdAt: string;
}

interface DevTaskOption {
  id: number;
  title: string;
  projectName?: string;
}

export const DeveloperGithub: React.FC = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState<CommitActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DevTaskOption[]>([]);

  // Record Commit Modal state
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");

  const fetchCommits = async () => {
    setLoading(true);
    try {
      const res = await API.get("/me/commits");
      if (res.data?.commits && Array.isArray(res.data.commits)) {
        setCommits(res.data.commits);
      } else {
        setCommits([]);
      }
    } catch {
      setCommits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTasks = async () => {
    try {
      const res = await API.get("/me/tasks");
      if (res.data?.tasks && Array.isArray(res.data.tasks)) {
        setTasks(
          res.data.tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            projectName: t.projectName,
          }))
        );
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCommits();
    fetchMyTasks();
  }, []);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError("");
    setRecordSuccess("");

    if (!commitMessage.trim()) {
      setRecordError("Please provide a commit message.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.post("/me/commits", {
        taskId: selectedTaskId ? Number(selectedTaskId) : undefined,
        message: commitMessage.trim(),
        hash: commitHash.trim() || undefined,
      });

      if (res.data?.commit) {
        setCommits((prev) => [res.data.commit, ...prev]);
      }
      setRecordSuccess("Commit activity successfully recorded.");
      setCommitMessage("");
      setCommitHash("");
      setSelectedTaskId("");
      setTimeout(() => {
        setShowRecordModal(false);
        setRecordSuccess("");
      }, 1000);
    } catch (err: any) {
      setRecordError(err.response?.data?.error || "Failed to record commit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">GitHub Integration & Activity</h1>
          <p className="mt-1 text-xs text-[#888]">
            Code commits, pull requests, and repository webhooks linked to your assigned tasks.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setRecordError("");
              setRecordSuccess("");
              setShowRecordModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-[#e5e5e5] transition"
          >
            <Plus size={14} /> Record Commit
          </button>
          <button
            onClick={fetchCommits}
            className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#171717] px-4 py-2 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Sync Git Feed
          </button>
        </div>
      </div>

      {/* GitHub Account status card */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202020] border border-[#333] text-white">
            <GitBranch size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Linked GitHub Account</p>
            <p className="text-xs text-[#777] mt-0.5">
              {user?.githubUsername
                ? `@${user.githubUsername} is linked and actively tracking task references.`
                : "No GitHub username specified in your profile settings."}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-950/40 border border-emerald-900/60 px-3 py-1 text-[11px] font-semibold text-emerald-300">
          Webhook Listener Active
        </span>
      </div>

      {/* Commit & PR Activity Ledger */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
        <div className="border-b border-[#242424] bg-[#171717] px-5 py-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Recent Git Telemetry & Commits
          </h3>
          <span className="text-[11px] text-[#777] font-mono">{commits.length} commits logged</span>
        </div>

        {commits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] text-[#888]">
              <GitCommit size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No Git Commits Recorded Yet</p>
              <p className="text-xs text-[#777] mt-1 max-w-md mx-auto">
                Push code to your branch including #TASK-ID in your commit message, or click "Record Commit" to log your work directly.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {commits.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 hover:bg-[#181818] transition gap-4 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 text-neutral-400">
                    {c.type === "pull_request" ? (
                      <GitPullRequest size={15} />
                    ) : (
                      <GitCommit size={15} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{c.message}</p>
                    <div className="flex items-center gap-2 text-[11px] text-[#777] mt-0.5">
                      <span className="font-mono text-[#aaa]">{c.hash}</span>
                      {c.taskId && <span className="text-indigo-400">· Linked to TASK-{c.taskId}</span>}
                      <span>· {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#333] p-1.5 text-[#888] hover:text-white hover:bg-[#202020] transition shrink-0"
                    title="View on GitHub"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Commit Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#202020] border border-[#333] text-white">
                  <GitCommit size={17} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Record Git Commit</h3>
                  <p className="text-xs text-[#888]">Link code changes to your active engineering task.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-[#777] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {recordError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-xs text-red-300">
                <AlertCircle size={15} /> <span>{recordError}</span>
              </div>
            )}

            {recordSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                <CheckCircle2 size={15} /> <span>{recordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">
                  Associated Task (Optional)
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTaskId(id);
                    if (id && !commitMessage) {
                      setCommitMessage(`feat: progress on #${id}`);
                    }
                  }}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                >
                  <option value="">No specific task (General commit)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      TASK-{t.id}: {t.title} {t.projectName ? `(${t.projectName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">
                  Commit Message <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="e.g. feat(auth): implement JWT validation #101"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">
                  Commit Hash (Optional)
                </label>
                <input
                  type="text"
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  placeholder="Leave empty for auto-generated SHA-1 hash"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-[#777]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs font-medium text-[#aaa] hover:bg-[#202020] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-[#e5e5e5] transition disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Log Commit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
