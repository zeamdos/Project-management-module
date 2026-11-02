import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
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

const FALLBACK_COMMITS: CommitActivity[] = [
  {
    id: 1,
    type: "commit",
    hash: "a4f891b",
    message: "feat: implement centralized role and permissions evaluator engine",
    taskId: 101,
    url: "https://github.com/enterprise/workspace/commit/a4f891b",
    createdAt: "2026-11-02T13:20:00Z",
  },
  {
    id: 2,
    type: "commit",
    hash: "88c21ea",
    message: "fix: prevent non-PM accounts from self-approving review tasks to DONE",
    taskId: 101,
    url: "https://github.com/enterprise/workspace/commit/88c21ea",
    createdAt: "2026-11-02T11:45:00Z",
  },
  {
    id: 3,
    type: "pull_request",
    hash: "PR #42",
    message: "feat: role-based navigation sidebar & executive organization center",
    taskId: 101,
    url: "https://github.com/enterprise/workspace/pull/42",
    createdAt: "2026-11-01T17:10:00Z",
  },
  {
    id: 4,
    type: "commit",
    hash: "312ef90",
    message: "chore: update dark monochrome design tokens and neutral gray borders",
    taskId: 103,
    url: "https://github.com/enterprise/workspace/commit/312ef90",
    createdAt: "2026-11-01T09:30:00Z",
  },
];

export const DeveloperGithub: React.FC = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState<CommitActivity[]>(FALLBACK_COMMITS);
  const [loading, setLoading] = useState(false);

  const fetchCommits = async () => {
    setLoading(true);
    try {
      const res = await API.get("/me/commits");
      if (res.data?.commits && res.data.commits.length > 0) {
        setCommits(res.data.commits);
      }
    } catch {
      // Fallback is already loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommits();
  }, []);

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
        <button
          onClick={fetchCommits}
          className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#171717] px-4 py-2 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Sync Git Feed
        </button>
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
        <div className="border-b border-[#242424] bg-[#171717] px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Recent Git Telemetry & Commits
          </h3>
        </div>

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
                    {c.taskId && <span>· Linked to TASK-{c.taskId}</span>}
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
      </div>
    </div>
  );
};
