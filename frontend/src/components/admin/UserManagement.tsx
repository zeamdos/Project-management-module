import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Key,
  RefreshCw,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { User, UserRole, UserStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { getRoles } from "../../services/permissions";
import API from "../../services/api";

interface UserManagementProps {
  onConfigureUserPermissions: (user: User) => void;
}

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";

function generatePassword(length = 12): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length]).join("");
}

function errorMessage(err: any, fallback: string): string {
  const fromServer = err?.response?.data?.error || err?.response?.data?.message;
  if (fromServer) return String(fromServer);
  if (err?.request && !err?.response) {
    return "Cannot reach the server. Check that the backend is running.";
  }
  return fallback;
}

function mapServerUser(su: any): User {
  return {
    id: su.id,
    orgId: su.orgId,
    name: su.name,
    email: su.email,
    role: su.role,
    department: su.department || "Engineering",
    team: su.team || "General",
    specialty: su.specialty || undefined,
    assignedPmId: su.assignedPmId || undefined,
    status: su.status || "ACTIVE",
    phoneNumber: su.phoneNumber || null,
    githubUsername: su.githubUsername || null,
    telegramLinked: !!su.telegramChatId,
    isTemporaryPassword: su.isTemporaryPassword === true,
    avatar: su.name ? su.name.slice(0, 2).toUpperCase() : "U",
    createdAt: su.createdAt,
  } as User;
}

/** "Developer - Frontend" -> { role: "DEVELOPER", specialty: "Frontend", ... } */
function parseUnifiedRole(unified: string) {
  const [roleStr, specialtyStr] = unified.split(" - ");
  const role = (roleStr === "Manager" ? "MANAGER" : roleStr === "Administrator" ? "ADMIN" : "DEVELOPER") as UserRole;
  const department =
    role === "ADMIN" ? "Executive Leadership" : role === "MANAGER" ? "Engineering Management" : "Engineering";
  return { role, specialty: specialtyStr || undefined, department };
}

export const UserManagement: React.FC<UserManagementProps> = ({
  onConfigureUserPermissions,
}) => {
  const { refreshUsers, allUsers } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [unifiedRole, setUnifiedRole] = useState("Developer - Frontend");
  const [team, setTeam] = useState("Frontend Engineering");
  const [assignedPmId, setAssignedPmId] = useState<number | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editError, setEditError] = useState("");

  const roles = getRoles();
  const teamNames = useMemo(
    () => Array.from(new Set(allUsers.map((u) => u.team).filter((t): t is string => Boolean(t)))),
    [allUsers]
  );
  const projectManagers = usersList.filter(
    (u) => u.role === "PROJECT_MANAGER" || u.role === "MANAGER"
  );

  const loadUsers = useCallback(async () => {
    setLoadError("");
    try {
      const res = await API.get("/admin/users");
      const list = res.data?.users ?? res.data;
      if (!Array.isArray(list)) throw new Error("Unexpected response from /admin/users");
      setUsersList(list.map(mapServerUser));
    } catch (err) {
      setLoadError(errorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const generateRandomPassword = () => setGeneratedPassword(generatePassword());

  const handleOpenCreateModal = () => {
    generateRandomPassword();
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setGithubUsername("");
    setSkillsInput("");
    setUnifiedRole("Developer - Frontend");
    setTeam(teamNames[0] || "Frontend Engineering");
    setAssignedPmId(projectManagers[0]?.id || undefined);
    setCreateSuccessMsg("");
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || submitting) return;

    const { role, specialty, department } = parseUnifiedRole(unifiedRole);
    const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);

    setSubmitting(true);
    setCreateError("");
    try {
      const res = await API.post("/admin/users", {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        department,
        team,
        specialty,
        assignedPmId: role === "DEVELOPER" ? assignedPmId : undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        githubUsername: githubUsername.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
      });

      const { user: created, tempPassword } = res.data;
      const newUser = mapServerUser({
        ...created,
        department: created.department || department,
        team: created.team || team,
        assignedPmId: created.assignedPmId || (role === "DEVELOPER" ? assignedPmId : undefined),
        phoneNumber: created.phoneNumber || phoneNumber.trim() || null,
        githubUsername: created.githubUsername || githubUsername.trim() || null,
        isTemporaryPassword: true,
      });
      setUsersList((prev) => [newUser, ...prev]);
      // Show the password the SERVER generated, not the client-side preview.
      setGeneratedPassword(tempPassword);
      setCreateSuccessMsg(
        `Account for ${newUser.name} provisioned.\n\nShare the temporary password securely with the employee. They must change it upon first login.`
      );
      void refreshUsers();
    } catch (err) {
      setCreateError(errorMessage(err, "Could not create the account."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    const activeAdmins = usersList.filter((u) => u.role === "ADMIN" && u.status === "ACTIVE");
    if (targetUser.role === "ADMIN" && targetUser.status === "ACTIVE" && activeAdmins.length <= 1) {
      setActionError("Cannot deactivate the sole active Administrator.");
      return;
    }

    const newStatus: UserStatus = targetUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionError("");
    try {
      await API.patch(`/admin/users/${targetUser.id}`, { status: newStatus });
      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u)));
      void refreshUsers();
    } catch (err) {
      setActionError(errorMessage(err, `Could not update status for ${targetUser.name}.`));
    }
  };

  const handleResetPassword = async (targetUser: User) => {
    if (!window.confirm(`Reset the password for ${targetUser.name}? Their current password will stop working.`)) {
      return;
    }
    setActionError("");
    try {
      const res = await API.post(`/admin/users/${targetUser.id}/reset-password`);
      const { tempPassword } = res.data;
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isTemporaryPassword: true } : u))
      );
      window.alert(
        `Temporary password for ${targetUser.name}:\n\n${tempPassword}\n\nShare this securely. They must change it on next login.`
      );
    } catch (err) {
      setActionError(errorMessage(err, `Could not reset the password for ${targetUser.name}.`));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || submitting) return;

    setSubmitting(true);
    setEditError("");
    try {
      await API.patch(`/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        role: editingUser.role,
        status: editingUser.status,
        specialty: editingUser.specialty,
        assignedPmId: editingUser.assignedPmId || null,
        department: editingUser.department,
        team: editingUser.team,
        githubUsername: editingUser.githubUsername,
        phoneNumber: editingUser.phoneNumber,
      });
      setUsersList((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
      void refreshUsers();
      setEditingUser(null);
    } catch (err) {
      setEditError(errorMessage(err, "Could not save changes."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      `${u.name} ${u.email} ${u.team || ""} ${u.phoneNumber || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role.toUpperCase() === roleFilter.toUpperCase();
    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User & Account Management</h1>
          <p className="mt-1 text-xs text-[#888]">
            Authoritative provisioning center. Public registration is closed; all accounts and manager assignments are controlled here.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          <UserPlus size={15} /> Create User Account
        </button>
      </div>

      {(loadError || actionError) && (
        <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{loadError || actionError}</span>
          {loadError && (
            <button onClick={loadUsers} className="underline hover:text-white">
              Retry
            </button>
          )}
        </div>
      )}
      {loading && <p className="text-xs text-[#777]">Loading users...</p>}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2">
          <Search size={15} className="text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, phone, or team..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="DEVELOPER">Developer</option>
            <option value="SENIOR_DEVELOPER">Senior Developer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-2 text-xs text-white outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242424] bg-[#171717] text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-4">Role / Domain</th>
                <th className="py-3.5 px-4">Department / Team</th>
                <th className="py-3.5 px-4">Assigned PM</th>
                <th className="py-3.5 px-4">Phone / Telegram</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-xs">
              {filteredUsers.map((m) => {
                const assignedPm = usersList.find((u) => u.id === m.assignedPmId);
                const isActive = m.status === "ACTIVE";

                return (
                  <tr key={m.id} className="hover:bg-[#181818] transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#222] text-xs font-bold text-white border border-[#303030]">
                          {m.avatar || m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{m.name}</p>
                          <p className="text-[11px] text-[#777]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block rounded-md border border-[#303030] bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-medium text-[#ccc]">
                        {m.role}
                      </span>
                      {m.specialty && (
                        <p className="text-[10px] text-neutral-400 mt-1 font-mono">{m.specialty}</p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#aaa]">
                      <p>{m.team || "Unassigned"}</p>
                      <p className="text-[10px] text-[#666]">{m.department || "Organization"}</p>
                    </td>
                    <td className="py-4 px-4">
                      {assignedPm ? (
                        <div>
                          <p className="font-medium text-white">{assignedPm.name}</p>
                          <p className="text-[10px] text-[#666]">{assignedPm.email}</p>
                        </div>
                      ) : m.role === "DEVELOPER" ? (
                        <span className="text-amber-400/80 text-[11px]">Unassigned PM</span>
                      ) : (
                        <span className="text-[#666]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#aaa]">
                      <p className="font-mono text-[11px]">{m.phoneNumber || "No phone"}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#777]">
                        {m.telegramLinked ? (
                          <span className="text-emerald-400 font-medium">● Telegram Linked</span>
                        ) : (
                          <span className="text-[#666]">○ Not Linked</span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                          isActive
                            ? "bg-neutral-800 text-neutral-200"
                            : "bg-red-950/40 text-red-400 border border-red-900/40"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-neutral-300" : "bg-red-400"}`} />
                        {m.status}
                      </span>
                      {m.isTemporaryPassword && (
                        <span className="ml-2 text-[9px] text-amber-400" title="Must change password on login">
                          (Temp PW)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onConfigureUserPermissions(m)}
                          className="rounded-lg border border-[#333] px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#252525] hover:text-white transition"
                          title="Configure matrix permissions for this user"
                        >
                          Permissions
                        </button>
                        <button
                          onClick={() => setEditingUser(m)}
                          className="rounded-lg border border-[#333] px-2.5 py-1 text-[11px] text-[#ccc] hover:bg-[#252525] hover:text-white transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(m)}
                          className="rounded-lg p-1.5 text-[#777] hover:bg-[#252525] hover:text-amber-300 transition"
                          title="Generate temporary reset password"
                        >
                          <Key size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`rounded-lg p-1.5 transition ${
                            isActive
                              ? "text-[#777] hover:bg-[#252525] hover:text-red-400"
                              : "text-red-400 hover:bg-[#252525] hover:text-neutral-200"
                          }`}
                          title={isActive ? "Deactivate account" : "Reactivate account"}
                        >
                          {isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-[#333] bg-[#141414] shadow-2xl flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-[#262626] px-6 pt-6 pb-4 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white">Provision New Account</h3>
                <p className="text-xs text-[#888]">
                  Authorized Admin account generator with temporary login credentials.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#777] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-6 pt-4 space-y-5 flex-1">
            {createSuccessMsg ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  <div className="flex items-center gap-2 font-semibold text-white mb-2">
                    <CheckCircle2 size={16} /> User Account Provisioned Successfully
                  </div>
                  {createSuccessMsg}
                </div>

                <div className="rounded-xl border border-[#2b2b2b] bg-[#181818] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase text-[#666]">Temporary Password</p>
                    <p className="font-mono text-sm font-semibold text-white mt-0.5">
                      {generatedPassword}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-xs text-[#ccc] hover:bg-[#252525]"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="text-[11px] text-[#777]">
                  The new user will be forced to change this temporary password upon their first sign-in.
                </p>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full rounded-xl bg-[#e5e5e5] py-2.5 text-xs font-semibold text-[#141414]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="space-y-4">
                {createError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{createError}</span>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jordan Hayes"
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@enterprise.com"
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Role & Department</label>
                    <select
                      value={unifiedRole}
                      onChange={(e) => setUnifiedRole(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Developer - Frontend">Developer - Frontend</option>
                      <option value="Developer - Backend">Developer - Backend</option>
                      <option value="Developer - UI/UX">Developer - UI/UX</option>
                      <option value="Developer - AI">Developer - AI / ML</option>
                      <option value="Developer - QA">Developer - QA</option>
                      <option value="Manager">Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned Team</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      {teamNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="Core Delivery">Core Delivery</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                {unifiedRole.startsWith("Developer") && (
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">
                      Assigned Project Manager
                    </label>
                    <select
                      value={assignedPmId || ""}
                      onChange={(e) => setAssignedPmId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="">No PM Assigned</option>
                      {projectManagers.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.name} ({pm.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="React, Node.js, TypeScript, Docker"
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                  />
                  <p className="text-[10px] text-[#666] mt-1">
                    Add the user's technical skills (e.g., React, Python, AWS)
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">
                      Phone Number <span className="text-[10px] text-[#777]">(Telegram Auto-Linking)</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+251911445566 or +1234567890"
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="e.g. dev-username"
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                    />
                  </div>
                </div>

                {/* Auto-Generated Temporary Password Box */}
                <div className="rounded-xl border border-[#2d2d2d] bg-[#171717] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#aaa]">Generated Temporary Password</span>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="inline-flex items-center gap-1 text-[11px] text-[#888] hover:text-white"
                    >
                      <RefreshCw size={12} /> Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={generatedPassword}
                    className="w-full rounded-lg border border-[#333] bg-[#101010] px-3 py-2 text-xs font-mono text-white outline-none"
                  />
                  <p className="text-[10px] text-[#666]">
                    The employee will be required to change this on their initial sign-in.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                  >
                    {submitting ? "Provisioning..." : "Provision Account"}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-[#333] bg-[#141414] shadow-2xl flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-[#262626] px-6 pt-6 pb-4 shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white">Edit User: {editingUser.name}</h3>
                <p className="text-xs text-[#888]">Update role, assigned Project Manager, team, and phone number.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-[#777] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-6 pt-4 flex-1">
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {editError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{editError}</span>
                  </div>
                )}

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned Team</label>
                  <input
                    type="text"
                    value={editingUser.team || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">Engineering Specialty</label>
                  <select
                    value={editingUser.specialty || "Frontend"}
                    onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="AI">AI / Machine Learning</option>
                    <option value="QA">QA & Verification</option>
                  </select>
                </div>
              </div>

              {/* Assigned Project Manager Dropdown */}
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">
                  Assigned Project Manager (PM)
                </label>
                <select
                  value={editingUser.assignedPmId ?? ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      assignedPmId: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                >
                  <option value="">No PM Assigned (Unassigned)</option>
                  {projectManagers.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} ({pm.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#666] mt-1">
                  Assigning a PM links this developer's tasks, blocker escalations, and review workflows directly to that manager.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">
                    Phone Number <span className="text-[10px] text-[#777]">(Telegram Link)</span>
                  </label>
                  <input
                    type="text"
                    value={editingUser.phoneNumber || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    placeholder="+251911445566"
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#aaa] mb-1">GitHub Username</label>
                  <input
                    type="text"
                    value={editingUser.githubUsername || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, githubUsername: e.target.value })}
                    placeholder="alexmercer-dev"
                    className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};