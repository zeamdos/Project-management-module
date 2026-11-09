import React, { useState } from "react";
import { CheckCircle2, GitBranch, Key, Phone, Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [quietHoursStart, setQuietHoursStart] = useState(user?.quietHoursStart || "22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState(user?.quietHoursEnd || "08:00");
  const [notifyInApp, setNotifyInApp] = useState(user?.notifyInApp !== false);
  const [notifyTelegram, setNotifyTelegram] = useState(user?.notifyTelegram !== false);
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail !== false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    updateUser({
      name: name.trim(),
      githubUsername: githubUsername.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      quietHoursStart,
      quietHoursEnd,
      notifyInApp,
      notifyTelegram,
      notifyEmail,
    });

    setSavedMsg("Profile settings saved successfully.");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    if (newPassword.length < 8) {
      setPwMsg("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg("Passwords do not match.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwMsg("Password changed successfully.");
    setTimeout(() => setPwMsg(""), 3500);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Account & Preferences</h1>
        <p className="mt-1 text-xs text-[#888]">
          Manage your identity, notification delivery channels, and authentication credentials.
        </p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 text-xs text-neutral-200">
          <CheckCircle2 size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Identity Card */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#333] bg-[#202020] text-xl font-bold text-white">
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "U")}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
              <p className="text-xs text-[#888]">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-[#333] bg-[#1a1a1a] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#ccc]">
                  {user?.role}
                </span>
                {user?.specialty && (
                  <span className="rounded-md border border-[#2b2b2b] bg-[#171717] px-2 py-0.5 text-[10px] text-[#aaa]">
                    {user.specialty}
                  </span>
                )}
                <span className="rounded-md bg-[#1f1f1f] px-2 py-0.5 text-[10px] text-[#777]">
                  {user?.team || "Organization Team"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-4 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full rounded-xl border border-[#242424] bg-[#0c0c0c] px-4 py-2.5 text-xs text-[#666] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#aaa] mb-1.5">
                <GitBranch size={14} /> GitHub Username
              </label>
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g. alexmercer"
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-4 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#aaa] mb-1.5">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+251..."
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-4 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
          </div>

          {/* Telegram linking info */}
          <div className="rounded-xl border border-[#2b2b2b] bg-[#161616] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#222] text-[#ccc]">
                <Send size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Telegram Urgent Alerts Bot</p>
                <p className="text-xs text-[#777]">
                  {user?.telegramLinked
                    ? "Telegram bot is paired and active for blocker escalations."
                    : "Pair with @pro_managemnt_bot on Telegram for real-time alerts."}
                </p>
              </div>
            </div>
            <a
              href="https://t.me/pro_managemnt_bot"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#383838] bg-[#1f1f1f] px-3 py-1.5 text-xs font-medium text-[#ccc] hover:bg-[#282828] hover:text-white transition"
            >
              {user?.telegramLinked ? "Re-link Bot" : "Pair Telegram"}
            </a>
          </div>

          {/* Notification Preferences */}
          <div className="pt-4 border-t border-[#242424] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#777]">
              Notification Channels & Quiet Hours
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2.5 rounded-xl border border-[#2b2b2b] bg-[#111] p-3 text-xs text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="rounded border-[#444] bg-transparent text-white"
                />
                In-App Center
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-[#2b2b2b] bg-[#111] p-3 text-xs text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="rounded border-[#444] bg-transparent text-white"
                />
                Telegram Alerts
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-[#2b2b2b] bg-[#111] p-3 text-xs text-[#ccc] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-[#444] bg-transparent text-white"
                />
                Email Digests
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-[#777] mb-1">Quiet Hours Start</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none focus:border-[#666]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] mb-1">Quiet Hours End</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none focus:border-[#666]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#e5e5e5] px-5 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            Save Profile Changes
          </button>
        </form>
      </section>

      {/* Password Change Section */}
      <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222] text-[#bbb]">
            <Key size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Security & Password</h3>
            <p className="text-xs text-[#777]">Ensure your account uses a secure permanent password.</p>
          </div>
        </div>

        {pwMsg && (
          <p className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-xs text-neutral-200">
            {pwMsg}
          </p>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] text-[#777] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#777] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl border border-[#383838] bg-[#1d1d1d] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#252525] transition"
          >
            Update Password
          </button>
        </form>
      </section>
    </div>
  );
};
