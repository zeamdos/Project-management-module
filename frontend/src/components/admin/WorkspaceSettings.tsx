import React, { useState } from "react";
import { CheckCircle2, Globe, Lock, Save, Settings, ShieldCheck, Sliders } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addAuditLog } from "../../services/mockDataStore";

export const WorkspaceSettings: React.FC = () => {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("Enterprise HQ");
  const [domain, setDomain] = useState("enterprise.com");
  const [requireReviewForDone, setRequireReviewForDone] = useState(true);
  const [progressCycleDays, setProgressCycleDays] = useState(7);
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(false);
  const [forceTempPasswordChange, setForceTempPasswordChange] = useState(true);
  const [savedMsg, setSavedMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      addAuditLog(
        user,
        "WORKSPACE_SETTINGS_SAVED",
        "Organization",
        1,
        `Updated workspace governance policies: ReviewRequired=${requireReviewForDone}, Cycle=${progressCycleDays}d`
      );
    }
    setSavedMsg("Workspace policy settings saved successfully.");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Governance Settings</h1>
        <p className="mt-1 text-xs text-[#888]">
          Control organizational parameters, security enforcement, review policies, and account provisioning rules.
        </p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 text-xs text-neutral-200">
          <CheckCircle2 size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Identity */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe size={16} /> Organization Profile
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Primary Email Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
              />
            </div>
          </div>
        </section>

        {/* Development & Workflow Policies */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders size={16} /> Workflow & Review Policies
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-[#2b2b2b] bg-[#171717] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={requireReviewForDone}
                onChange={(e) => setRequireReviewForDone(e.target.checked)}
                className="mt-0.5 rounded border-[#444] bg-transparent text-white"
              />
              <div>
                <p className="text-xs font-semibold text-white">Require Approved Review for DONE</p>
                <p className="text-[11px] text-[#777] mt-0.5">
                  Developers can move tasks to &ldquo;In Review&rdquo;, but only authorized PMs or designated reviewers can transition to &ldquo;Done&rdquo;.
                </p>
              </div>
            </label>

            <div className="rounded-xl border border-[#2b2b2b] bg-[#171717] p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white">Progress Check-In Frequency</p>
                <p className="text-[11px] text-[#777] mt-0.5">
                  Automated interval prompting developers for confidence scores and blocker updates.
                </p>
              </div>
              <select
                value={progressCycleDays}
                onChange={(e) => setProgressCycleDays(Number(e.target.value))}
                className="rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none"
              >
                <option value={3}>Every 3 Days (Sprint cadence)</option>
                <option value={7}>Weekly (7 Days standard)</option>
                <option value={14}>Bi-Weekly (14 Days)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Security & Access Policies */}
        <section className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck size={16} /> Access & Provisioning Rules
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-xl border border-[#2b2b2b] bg-[#171717] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={!allowSelfRegistration}
                readOnly
                className="mt-0.5 rounded border-[#444] bg-transparent text-white"
              />
              <div>
                <p className="text-xs font-semibold text-white">Strict Admin-Only Provisioning (No Public Registration)</p>
                <p className="text-[11px] text-[#777] mt-0.5">
                  Public signup endpoints are deactivated. Only authenticated organization Admins can issue credentials.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-[#2b2b2b] bg-[#171717] p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={forceTempPasswordChange}
                onChange={(e) => setForceTempPasswordChange(e.target.checked)}
                className="mt-0.5 rounded border-[#444] bg-transparent text-white"
              />
              <div>
                <p className="text-xs font-semibold text-white">Mandatory Temporary Password Reset</p>
                <p className="text-[11px] text-[#777] mt-0.5">
                  Enforce immediate password change on first login for all admin-created accounts.
                </p>
              </div>
            </label>
          </div>
        </section>

        <button
          type="submit"
          className="rounded-xl bg-[#e5e5e5] px-6 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          Save Workspace Policies
        </button>
      </form>
    </div>
  );
};
