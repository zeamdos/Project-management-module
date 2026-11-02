import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

export const ChangePasswordModal: React.FC = () => {
  const { user, isTemporaryPasswordRequired, resolveTemporaryPassword, updateUser } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isTemporaryPasswordRequired) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await API.patch("/me", {
        githubUsername: githubUsername.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
      }).catch(() => undefined);
    } catch {
      // offline fallback
    }


    // Update profile additions and clear temporary password flag
    updateUser({
      githubUsername: githubUsername.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      isTemporaryPassword: false,
    });

    resolveTemporaryPassword(newPassword);
    setSuccess(true);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-[#333] bg-[#141414] p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[#242424] pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-300">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">First-Time Setup Required</h2>
            <p className="text-xs text-[#888]">
              Your account was provisioned with temporary credentials. Set a permanent password to continue.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/20 p-3.5 text-xs text-red-300">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">New Permanent Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-4 py-3 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-4 py-3 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div className="pt-3 border-t border-[#242424] space-y-4">
            <p className="text-xs font-semibold text-[#bbb]">Profile Verification</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#777] mb-1">GitHub Username</label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. username"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#666]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#777] mb-1">Phone Number (SMS alerts)</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+251..."
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#666]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 rounded-xl bg-[#e5e5e5] py-3 text-xs font-semibold text-[#141414] hover:bg-white transition"
          >
            Update Credentials & Access Workspace
          </button>
        </form>
      </div>
    </div>
  );
};
