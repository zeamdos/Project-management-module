import React, { useState, useEffect } from "react";
import API from "./services/api";
import { FolderKanban, LogOut, Send, GitCommit, CheckCircle2, ExternalLink, Bot, User as UserIcon } from "lucide-react";

const TEAMS = ["Frontend", "Backend", "UI/UX", "AI"];
const BOT_NAME = "@pro_managemnt_bot";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  orgId: number;
  specialty?: string | null;
  telegramLinked?: boolean;
};

// Shared look: black, white and grey only.
const inputCls =
  "w-full bg-black border border-neutral-700 rounded px-3 py-2.5 text-base sm:text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white";
const labelCls = "block text-sm text-neutral-400 mb-1.5";
const primaryBtn =
  "bg-white text-black font-medium rounded px-4 py-2.5 text-sm hover:bg-neutral-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const ghostBtn =
  "border border-neutral-700 text-neutral-200 rounded px-4 py-2.5 text-sm hover:border-white hover:text-white transition-colors disabled:opacity-40";

const pretty = (s: string) => {
  const t = (s || "").replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function readStoredUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/* ------------------------------ Sign in / Register ------------------------------ */

function AuthScreen({ onAuthed }: { onAuthed: (token: string, user: SessionUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [skillsInput, setSkillsInput] = useState("React, Node.js, TypeScript");
  const [githubUsername, setGithubUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!isLogin) {
        const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
        await API.post("/auth/register", {
          email,
          password,
          name,
          specialty,
          skills,
          githubUsername: githubUsername || undefined,
        });
      }
      const res = await API.post("/auth/login", { email, password });
      onAuthed(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not reach the server. Check that the backend is running on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between border-r border-neutral-800 p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <FolderKanban size={28} strokeWidth={1.5} />
          <span className="text-lg font-semibold tracking-tight">Project Manager</span>
        </div>
        <div>
          <h1 className="text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.05]">
            Plan the work.
            <br />
            Split it by team.
            <br />
            Watch it get done.
          </h1>
          <p className="text-neutral-400 mt-6 max-w-md leading-relaxed">
            Every project is broken into tasks for Frontend, Backend, UI/UX and AI, and each developer sees exactly what they own.
          </p>
        </div>
        <p className="text-sm text-neutral-600">Status updates reach your PM and team on Telegram.</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <FolderKanban size={26} strokeWidth={1.5} />
          <h1 className="text-xl font-semibold tracking-tight">Project Manager</h1>
        </div>

        <h2 className="text-lg font-medium mb-1">{isLogin ? "Sign in" : "Create your account"}</h2>
        <p className="text-sm text-neutral-500 mb-6">
          {isLogin ? "Use the email and password you registered with." : "Choose your team so tasks are assigned to the right people."}
        </p>

        {error && <div className="border border-white/60 rounded px-3 py-2.5 mb-5 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className={labelCls}>Full name</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Alex Mercer" />
              </div>
              <div>
                <label className={labelCls}>Your team</label>
                <select className={inputCls} value={specialty} onChange={(e) => setSpecialty(e.target.value)} required>
                  <option value="">Select a team</option>
                  {TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Skills, separated by commas</label>
                <input className={inputCls} value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="React, Node.js, TypeScript" />
              </div>
              <div>
                <label className={labelCls}>GitHub username</label>
                <input className={inputCls} value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="your-github-name" />
              </div>
            </>
          )}
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
            />
          </div>
          <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
            {loading ? "Please wait" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="mt-6 text-sm text-neutral-400 hover:text-white underline underline-offset-4"
        >
          {isLogin ? "New developer? Create an account" : "Already have an account? Sign in"}
        </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Developer dashboard ------------------------------ */

function DeveloperDashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [me, setMe] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [tasksError, setTasksError] = useState("");
  const [board, setBoard] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { status?: string; note: string }>>({});
  const [flash, setFlash] = useState("");
  const [tgUrl, setTgUrl] = useState("");
  const [waitingTelegram, setWaitingTelegram] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const guard = (err: any) => {
    if (err?.response?.status === 401 || err?.response?.status === 403) onUnauthorized();
  };

  const loadAll = async () => {
    try {
      const r = await API.get("/me");
      setMe(r.data);
    } catch (e) {
      guard(e);
    }
    try {
      const r = await API.get("/me/tasks");
      setTasks(r.data.tasks || []);
      setStatusOptions(r.data.statusOptions || []);
      setBoard(r.data.board || []);
      setTasksError("");
    } catch (e: any) {
      guard(e);
      setTasksError(e.response?.data?.error || "Could not load your tasks.");
    }
    try {
      const r = await API.get("/me/commits");
      setCommits(r.data.commits || []);
    } catch (e) {
      guard(e);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the developer presses Start in Telegram, notice it automatically.
  useEffect(() => {
    if (!waitingTelegram) return;
    const poll = setInterval(async () => {
      try {
        const r = await API.get("/me");
        if (r.data.telegramLinked) {
          setMe(r.data);
          setWaitingTelegram(false);
          setTgUrl("");
          setFlash("Telegram is connected. Deadline reminders will arrive there.");
        }
      } catch {
        /* keep waiting */
      }
    }, 3000);
    const stop = setTimeout(() => setWaitingTelegram(false), 120000);
    return () => {
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, [waitingTelegram]);

  const connectTelegram = async () => {
    try {
      const r = await API.post("/me/telegram-link");
      setTgUrl(r.data.url);
      setWaitingTelegram(true);
    } catch (e: any) {
      guard(e);
      setFlash(e.response?.data?.error || "Could not create the Telegram link.");
    }
  };

  const sendUpdate = async (task: any) => {
    const d = drafts[task.id] || { note: "" };
    const status = d.status || task.status;
    setSendingId(task.id);
    try {
      const r = await API.post(`/me/tasks/${task.id}/update`, { status, note: d.note });
      setFlash(`Update sent to ${r.data.notified} ${r.data.notified === 1 ? "person" : "people"} on Telegram.`);
      setDrafts((prev) => ({ ...prev, [task.id]: { note: "" } }));
      await loadAll();
    } catch (e: any) {
      guard(e);
      setFlash(e.response?.data?.error || "Could not send the update.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <main className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your work</h1>
      <p className="text-sm text-neutral-500 mt-1">
        {me?.specialty ? `${me.specialty} team` : "No team set"}
        {me?.githubUsername ? `, GitHub: ${me.githubUsername}` : ""}
      </p>

      {flash && (
        <div className="mt-6 border border-neutral-700 rounded px-4 py-3 text-sm flex items-start justify-between gap-4">
          <span>{flash}</span>
          <button onClick={() => setFlash("")} className="text-neutral-500 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-10 grid lg:grid-cols-3 gap-12">
        {/* Tasks */}
        <section className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-4">Assigned tasks</h2>

          {tasksError && <p className="text-sm border border-neutral-700 rounded px-4 py-3">{tasksError}</p>}

          {!tasksError && tasks.length === 0 && (
            <p className="text-sm text-neutral-500 border-t border-neutral-800 pt-4">
              No tasks yet. When your PM creates a project, the tasks for your team appear here.
            </p>
          )}

          <div className="divide-y divide-neutral-800 border-t border-neutral-800">
            {tasks.map((task) => {
              const d = drafts[task.id] || { note: "" };
              const selected = d.status || task.status;
              return (
                <article key={task.id} className="py-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-medium">{task.title}</h3>
                    <span className="text-xs border border-neutral-600 rounded-full px-2.5 py-0.5 text-neutral-300 whitespace-nowrap">
                      {pretty(task.status) || "No status"}
                    </span>
                  </div>
                  {task.description && <p className="text-sm text-neutral-300 mt-3 leading-relaxed max-w-prose whitespace-pre-line">{task.description}</p>}
                  <p className="text-sm text-neutral-500 mt-3">
                    {task.projectName ? `${task.projectName}, ` : ""}
                    {task.deadline ? `due ${new Date(task.deadline).toLocaleDateString()}` : "no deadline set"}
                  </p>
                  {task.repoUrl && (
                    <a
                      href={task.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4 mt-2 hover:text-white"
                    >
                      <ExternalLink size={14} /> Project repository
                    </a>
                  )}

                  <div className="mt-5 space-y-3">
                    {statusOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setDrafts((prev) => ({ ...prev, [task.id]: { ...d, status: s } }))}
                            className={`text-sm rounded px-3 py-1.5 border transition-colors ${
                              selected === s ? "bg-white text-black border-white" : "border-neutral-700 text-neutral-300 hover:border-white"
                            }`}
                          >
                            {pretty(s)}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-neutral-500">Finished? Choose In review. Your PM approves it to Done.</p>
                    <textarea
                      rows={2}
                      className={inputCls}
                      placeholder="What did you finish or get stuck on? (optional)"
                      value={d.note}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [task.id]: { ...d, note: e.target.value } }))}
                    />
                    <button className={`${primaryBtn} inline-flex items-center gap-2`} disabled={sendingId === task.id} onClick={() => sendUpdate(task)}>
                      <Send size={15} />
                      {sendingId === task.id ? "Sending" : "Send update to PM and team"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {board.length > 0 && (
            <div className="mt-14">
              <h2 className="text-lg font-medium">Project board</h2>
              <p className="text-sm text-neutral-500 mt-1">Everyone on your projects and what they are working on.</p>
              {board.map((b) => (
                <div key={b.projectId} className="mt-6">
                  <h3 className="font-medium">{b.projectName}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {b.deadline ? `Final deadline ${new Date(b.deadline).toLocaleDateString()}` : "No deadline set"}
                  </p>
                  {(Array.from(new Set(b.tasks.map((t: any) => String(t.team)))) as string[]).map((team) => (
                    <div key={team} className="mt-4">
                      <p className="text-sm text-neutral-300">{team}</p>
                      <div className="mt-2 divide-y divide-neutral-800 border-t border-neutral-800">
                        {b.tasks
                          .filter((t: any) => String(t.team) === team)
                          .map((t: any) => (
                            <div key={t.id} className="py-2.5 flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className={`text-sm ${t.isMine ? "text-white font-medium" : "text-neutral-300"}`}>
                                  {t.title}
                                  {t.isMine ? " (yours)" : ""}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {t.assigneeName || "Unassigned"}
                                  {t.deadline ? `, due ${new Date(t.deadline).toLocaleDateString()}` : ""}
                                </p>
                              </div>
                              <span className="text-xs border border-neutral-700 rounded-full px-2.5 py-0.5 text-neutral-400 whitespace-nowrap">
                                {pretty(t.status)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Side column */}
        <aside className="space-y-10">
          <section>
            <h2 className="text-lg font-medium mb-3">Telegram reminders</h2>
            {me?.telegramLinked ? (
              <p className="text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Connected. Deadlines and team updates arrive in Telegram.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-400">
                  Connect {BOT_NAME} to get deadline reminders and see when teammates post updates.
                </p>
                {!tgUrl ? (
                  <button onClick={connectTelegram} className={`${ghostBtn} inline-flex items-center gap-2`}>
                    <Bot size={16} /> Connect Telegram
                  </button>
                ) : (
                  <>
                    <a href={tgUrl} target="_blank" rel="noreferrer" className={`${primaryBtn} inline-flex items-center gap-2`}>
                      <ExternalLink size={15} /> Open the bot and press Start
                    </a>
                    <p className="text-xs text-neutral-500">{waitingTelegram ? "Waiting for you to press Start in Telegram." : "Link expired. Press Connect Telegram again."}</p>
                  </>
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Recent commits</h2>
            {commits.length === 0 ? (
              <p className="text-sm text-neutral-500">No commits recorded yet. They appear here once your GitHub username is linked and you push.</p>
            ) : (
              <ul className="divide-y divide-neutral-800 border-t border-neutral-800">
                {commits.map((c) => (
                  <li key={c.id} className="py-3 flex gap-3">
                    <GitCommit size={16} className="mt-0.5 text-neutral-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{c.message}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        <span className="font-mono">{c.hash}</span>, {new Date(c.createdAt).toLocaleDateString()}
                        {c.url && (
                          <>
                            {" "}
                            <a href={c.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
                              View
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

/* ------------------------------ Manager / admin view ------------------------------ */

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* the text is visible, so it can be copied by hand */
    }
  };
  return (
    <div>
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 border border-neutral-700 rounded px-3 py-2 text-sm break-all select-all">{value}</code>
        <button type="button" onClick={copy} className={`${ghostBtn} !py-2`}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function ManagerView({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [checkIn, setCheckIn] = useState("7");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<any>(null);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data.data || res.data);
      setLoadError("");
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onUnauthorized();
        return;
      }
      setLoadError(
        `Could not load projects (error ${err.response?.status ?? "no response"}). The backend terminal shows the exact reason.`
      );
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await API.post("/projects", {
        name,
        description: desc,
        updateIntervalDays: Number(checkIn),
        deadline: deadline || undefined,
        requirements: requirements.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
      });
      setCreated(res.data);
      setName("");
      setDesc("");
      setDeadline("");
      setRequirements("");
      setRepoUrl("");
      await fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || "Could not create the project.");
    } finally {
      setBusy(false);
    }
  };

  const assignedCount = created ? (created.tasks || []).filter((t: any) => t.assigneeId).length : 0;
  const unassignedCount = created ? (created.tasks || []).length - assignedCount : 0;

  return (
    <main className="w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-12">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-sm text-neutral-500 mt-1">Describe it once. It is split into tasks, and each team gets its own deadline and step-by-step instructions.</p>

        <form onSubmit={createProject} className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Project name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Final deadline</label>
            <input
              type="date"
              className={inputCls}
              style={{ colorScheme: "dark" }}
              min={tomorrow}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
            <label className={labelCls}>What should be built?</label>
            <textarea className={inputCls} rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} required />
            <p className="text-xs text-neutral-500 mt-1.5">
              Say what each team does: UI/UX, frontend, backend and AI. Tasks are created for the teams you mention.
            </p>
          </div>

          <div className="md:col-span-3">
            <label className={labelCls}>Requirements from you (optional)</label>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="Technology to use, rules to follow, must-have features"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>GitHub repository link (optional)</label>
            <input className={inputCls} placeholder="https://github.com/owner/repository" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
            <p className="text-xs text-neutral-500 mt-1.5">Leave it empty and a repository name is suggested under the company GitHub.</p>
          </div>
          <div>
            <label className={labelCls}>Progress check-in</label>
            <select className={inputCls} value={checkIn} onChange={(e) => setCheckIn(e.target.value)}>
              <option value="3">Every 3 days</option>
              <option value="7">Every 7 days</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Splitting into tasks" : "Create project"}
            </button>
          </div>
        </form>
      </section>

      {created && (
        <section className="border border-neutral-700 rounded p-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Project created: {created.project?.name}</h2>
              <p className="text-sm text-neutral-400 mt-1">
                {(created.tasks || []).length} tasks created, {assignedCount} assigned.{" "}
                {unassignedCount > 0
                  ? `${unassignedCount} task(s) have no developer yet because nobody has registered in that team.`
                  : "Each developer was told on Telegram if they connected it."}
              </p>
            </div>
            <button onClick={() => setCreated(null)} className="text-sm text-neutral-500 hover:text-white">
              Dismiss
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Repository</p>
            <a href={created.repo?.url} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 break-all">
              {created.repo?.url}
            </a>
            <p className="text-xs text-neutral-500">
              {created.repo?.suggested
                ? "No link was entered, so this one is suggested. Create an empty repository with exactly this name on GitHub before the team starts."
                : "Developers see this link on each of their tasks."}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Show commits and pull requests per developer</p>
            <p className="text-xs text-neutral-500">
              On GitHub open the repository, then Settings, Webhooks, Add webhook. Paste the values below and tick Pushes and Pull requests.
              Copy the secret now. It is shown only once.
            </p>
            <CopyField label="Payload URL" value={created.webhook?.url || ""} />
            <CopyField label="Content type" value={created.webhook?.contentType || "application/json"} />
            <CopyField label="Secret" value={created.webhook?.secret || ""} />
            {String(created.webhook?.url || "").includes("localhost") && (
              <p className="text-xs text-neutral-400 border border-neutral-700 rounded px-3 py-2">
                This address only works on your own computer. GitHub cannot reach localhost, so webhooks start working once the backend has a public address (set BACKEND_PUBLIC_URL in the backend .env).
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium mb-4">Projects</h2>
        {loadError && <p className="text-sm border border-neutral-700 rounded px-4 py-3 mb-4">{loadError}</p>}
        {!loadError && projects.length === 0 && <p className="text-sm text-neutral-500 border-t border-neutral-800 pt-4">No projects yet. Create the first one above.</p>}

        <div className="divide-y divide-neutral-800 border-t border-neutral-800">
          {projects.map((proj) => (
            <article key={proj.id} className="py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{proj.name}</h3>
                  <p className="text-sm text-neutral-400 mt-1 max-w-prose">{proj.description || "No description."}</p>
                </div>
                <span className="text-xs text-neutral-500 whitespace-nowrap">Project {proj.id}</span>
              </div>

              <div className="mt-3 text-sm text-neutral-400 space-y-1">
                <p>{proj.deadline ? `Final deadline: ${new Date(proj.deadline).toLocaleDateString()}` : "No deadline set."}</p>
                {proj.repositories?.[0]?.url && (
                  <a href={proj.repositories[0].url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-white break-all">
                    <ExternalLink size={14} /> {proj.repositories[0].url}
                  </a>
                )}
                {proj.requirements && <p className="whitespace-pre-line">Your requirements: {proj.requirements}</p>}
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                {proj.tasks && proj.tasks.length > 0 ? (
                  proj.tasks.map((task: any) => (
                    <div key={task.id} className="border border-neutral-800 rounded p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-medium">{task.title || task.name}</span>
                        {task.requiredRole && <span className="text-xs text-neutral-400 whitespace-nowrap">{pretty(task.requiredRole)}</span>}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">
                        {task.assignee ? task.assignee.name : "Unassigned"}, {pretty(task.status)}
                        {task.deadline ? `, due ${new Date(task.deadline).toLocaleDateString()}` : ""}
                      </p>
                      {task.description && (
                        <details className="mt-3">
                          <summary className="text-xs text-neutral-400 cursor-pointer hover:text-white">Show instructions</summary>
                          <p className="text-xs text-neutral-400 mt-2 whitespace-pre-line leading-relaxed">{task.description}</p>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No tasks for this project yet.</p>
                )}
              </div>

              <p className="text-xs text-neutral-500 mt-4">
                Update check-in every {proj.updateIntervalDays} days, created {new Date(proj.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ------------------------------ Root ------------------------------ */

// Vite's starter CSS squeezes #root into a centered, narrow column. This undoes it so the app uses the whole screen.
function GlobalReset() {
  return (
    <style>{`
      html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; background: #000; }
      body { display: block !important; place-items: initial !important; min-width: 0 !important; }
      #root { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important; }
    `}</style>
  );
}

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<SessionUser | null>(readStoredUser());

  const handleAuthed = (t: string, u: SessionUser) => {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return (
      <>
        <GlobalReset />
        <AuthScreen onAuthed={handleAuthed} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col">
      <GlobalReset />
      <header className="border-b border-neutral-800 px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <FolderKanban size={22} strokeWidth={1.5} className="shrink-0" />
          <span className="font-semibold tracking-tight truncate">Project Manager</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-300">
            <UserIcon size={16} />
            <span>{user.name}</span>
            <span className="text-xs border border-neutral-600 rounded-full px-2 py-0.5 text-neutral-400">
              {user.role === "DEVELOPER" ? user.specialty || "Developer" : pretty(user.role)}
            </span>
          </div>
          <button onClick={handleLogout} className={`${ghostBtn} !px-3 !py-2 inline-flex items-center gap-2`} title="Sign out">
            <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {user.role === "DEVELOPER" ? <DeveloperDashboard onUnauthorized={handleLogout} /> : <ManagerView onUnauthorized={handleLogout} />}
    </div>
  );
}

export default App;