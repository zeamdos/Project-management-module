import React, { useState } from "react";
import API from "../services/api";

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [skillsInput, setSkillsInput] = useState("React, Node.js, TypeScript");
  const [githubToken, setGithubToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await API.post("/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLoginSuccess();
      } else {
        const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
        await API.post("/auth/register", {
          email,
          password,
          name,
          teamName,
          skills,
          githubToken: githubToken || undefined,
          telegramChatId: telegramChatId || undefined,
        });
        // Auto login after registration or switch to login tab
        setIsLogin(true);
        setError("Registration successful! Please log in.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background aesthetic ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-900/60 backdrop-blur-2xl border border-gray-700/80 p-8 rounded-3xl shadow-2xl shadow-white/5 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? "Welcome back" : "Initialize Workspace"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isLogin ? "Enter your credentials to access telemetry" : "Create your developer profile"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Team</label>
                <select
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">Select your team</option>
                  <option value="Frontend Team">Frontend Team</option>
                  <option value="Backend Team">Backend Team</option>
                  <option value="UI/UX Team">UI/UX Team</option>
                  <option value="AI Team">AI Team</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Skills (Comma Separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, Node.js, TypeScript, Docker"
                  className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">GitHub Token</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Telegram Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    placeholder="123456789"
                    className="w-full bg-black/50 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acme.com"
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-white/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Register here" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}