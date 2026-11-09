import React, { useEffect, useState } from "react";
import API from "../services/api";

interface Task {
  id: number;
  title: string;
  description: string;
  requiredSkill: string;
  status: string;
  assignedDeveloper?: { name: string; email: string };
}

interface Project {
  id: number;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: string;
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await API.post("/projects", {
        name,
        description,
        updateIntervalDays: 7,
      });
      setSuccessMsg(res.data.message || "Project created & auto-processed by AI!");
      setName("");
      setDescription("");
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-gray-800/80 bg-gray-900/40 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-gray-600 to-gray-700 flex items-center justify-center font-bold text-white shadow-lg shadow-white/30">
            {user?.name?.[0] || "E"}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">{user?.name}</h1>
            <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-gray-700/10 text-gray-400 border border-gray-700/20 font-medium">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-red-400 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Project Creator Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-lg font-semibold text-white mb-1">AI Project Studio</h2>
            <p className="text-xs text-gray-400 mb-6">
              Enter your specifications. The AI engine will decompose tasks and assign them based on developer skills.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., E-Commerce Platform"
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Description & Technical Scope</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Build a React frontend interface with Tailwind and a Node.js REST API backend with PostgreSQL database..."
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-white/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 text-sm"
              >
                {loading ? "AI is decomposing tasks..." : "Deploy & Run AI Decomposer"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Projects & AI Task Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Organization Projects & Telemetry</h2>
            <span className="text-xs text-gray-400">{projects.length} Active Workspaces</span>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="bg-gray-900/40 border border-gray-800/80 rounded-3xl p-12 text-center text-gray-500">
                No projects created yet. Use the studio form on the left to spawn your first project.
              </div>
            ) : (
              projects.map((proj) => (
                <div key={proj.id} className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 p-6 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">{proj.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{proj.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 bg-black px-3 py-1 rounded-full border border-gray-800">
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* AI Subtasks Grid */}
                  <div className="border-t border-gray-800/80 pt-4 mt-4">
                    <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wider mb-3">AI Decomposed Subtasks & Assignees</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proj.tasks && proj.tasks.length > 0 ? (
                        proj.tasks.map((task) => (
                          <div key={task.id} className="bg-black/40 border border-gray-800/60 p-4 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-300">{task.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                {task.requiredSkill}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{task.description}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-900 text-[11px] text-gray-500">
                              <span>Assignee: <strong className="text-gray-300">{task.assignedDeveloper?.name || "Unassigned"}</strong></span>
                              <span className="uppercase text-[9px] tracking-wider font-bold text-yellow-400/90">{task.status}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">No tasks registered for this project.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}