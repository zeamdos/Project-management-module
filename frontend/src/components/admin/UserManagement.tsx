import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Key,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { User, UserRole, UserStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  addAuditLog,
  getStoredTeams,
  getStoredUsers,
  saveStoredUsers,
} from "../../services/mockDataStore";
import { getRoles } from "../../services/permissions";
import API from "../../services/api";


interface UserManagementProps {
  onConfigureUserPermissions: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  onConfigureUserPermissions,
}) => {
  const { user: currentUser, refreshUsers } = useAuth();
  const [usersList, setUsersList] = useState<User[]>(getStoredUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [assignedRole, setAssignedRole] = useState<UserRole>("DEVELOPER");
  const [department, setDepartment] = useState("Engineering");
  const [team, setTeam] = useState("Frontend Engineering");
  const [specialty, setSpecialty] = useState("Frontend");
  const [assignedPmId, setAssignedPmId] = useState<number | undefined>(2);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const roles = getRoles();
  const teams = getStoredTeams();
  const projectManagers = usersList.filter(
    (u) => u.role === "PROJECT_MANAGER" || u.role === "MANAGER"
  );

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
  };

  const handleOpenCreateModal = () => {
    generateRandomPassword();
    setFullName("");
    setEmail("");
    setAssignedRole("DEVELOPER");
    setDepartment("Engineering");
    setTeam(teams[0]?.name || "Frontend Engineering");
    setSpecialty("Frontend");
    setAssignedPmId(projectManagers[0]?.id || undefined);
    setCreateSuccessMsg("");
    setShowCreateModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    try {
      // Try real backend first
      const res = await API.post("/admin/users", {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        specialty: assignedRole === "DEVELOPER" ? specialty : undefined,
      });
      const { user: created, tempPassword } = res.data;
      const newUser: User = {
        id: created.id,
        orgId: created.orgId,
        name: created.name,
        email: created.email,
        role: created.role,
        department,
        team,
        specialty: created.specialty,
        status: "ACTIVE",
        isTemporaryPassword: true,
        avatar: created.name.slice(0, 2).toUpperCase(),
        createdAt: created.createdAt,
      };
      const updated = [newUser, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      refreshUsers();
      setCreateSuccessMsg(
        `✅ Account for ${newUser.name} provisioned.\n\nTemporary password: ${tempPassword}\n\nShare this securely with the employee — they must change it on first login.`
      );
    } catch {
      // Offline / no-backend fallback: local-only
      const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
      const newUser: User = {
        id: Date.now(),
        orgId: 1,
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        department,
        team,
        specialty: assignedRole === "DEVELOPER" ? specialty : undefined,
        assignedPmId: assignedRole === "DEVELOPER" ? assignedPmId : undefined,
        status: "ACTIVE",
        isTemporaryPassword: true,
        avatar: initials,
        createdAt: new Date().toISOString(),
      };
      const updated = [newUser, ...usersList];
      saveStoredUsers(updated);
      setUsersList(updated);
      refreshUsers();
      if (currentUser) addAuditLog(currentUser, "USER_PROVISIONED", "User", newUser.id, `Created ${newUser.name}`);
      setCreateSuccessMsg(`Account for ${newUser.name} created (offline). Temporary password: ${generatedPassword}`);
    }
  };

  const handleToggleStatus = async (targetUser: User) => {
    if (targetUser.role === "ADMIN" && usersList.filter((u) => u.role === "ADMIN").length <= 1) {
      alert("Cannot deactivate the sole Administrator.");
      return;
    }

    const newStatus: UserStatus = targetUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await API.patch(`/admin/users/${targetUser.id}`, { status: newStatus });
    } catch {
      // Fallback to local
    }

    const updated = usersList.map((u) =>
      u.id === targetUser.id ? { ...u, status: newStatus } : u
    );
    saveStoredUsers(updated);
    setUsersList(updated);
    refreshUsers();
    if (currentUser) {
      addAuditLog(currentUser, newStatus === "ACTIVE" ? "USER_REACTIVATED" : "USER_DEACTIVATED", "User", targetUser.id, `Status set to ${newStatus}`);
    }
  };

  const handleResetPassword = async (targetUser: User) => {
    try {
      const res = await API.post(`/admin/users/${targetUser.id}/reset-password`);
      const { tempPassword } = res.data;
      const updated = usersList.map((u) =>
        u.id === targetUser.id ? { ...u, isTemporaryPassword: true } : u
      );
      saveStoredUsers(updated);
      setUsersList(updated);
      refreshUsers();
      if (currentUser) addAuditLog(currentUser, "USER_PASSWORD_RESET", "User", targetUser.id, `Reset password for ${targetUser.name}`);
      alert(`🔑 Temporary password for ${targetUser.name}:\n\n${tempPassword}\n\nShare this securely. They must change it on next login.`);
    } catch {
      // Offline fallback
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
      let temp = "";
      for (let i = 0; i < 12; i++) temp += chars.charAt(Math.floor(Math.random() * chars.length));
      const updated = usersList.map((u) =>
        u.id === targetUser.id ? { ...u, isTemporaryPassword: true } : u
      );
      saveStoredUsers(updated);
      setUsersList(updated);
      refreshUsers();
      if (currentUser) addAuditLog(currentUser, "USER_PASSWORD_RESET", "User", targetUser.id, `Reset password for ${targetUser.name}`);
      alert(`🔑 Temporary password for ${targetUser.name}:\n\n${temp}\n\nThe user must reset this on their next login.`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await API.patch(`/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        role: editingUser.role,
        status: editingUser.status,
        specialty: editingUser.specialty,
        githubUsername: editingUser.githubUsername,
        phoneNumber: editingUser.phoneNumber,
      });
    } catch {
      // Fallback to local
    }


    const updated = usersList.map((u) =>
      u.id === editingUser.id ? editingUser : u
    );
    saveStoredUsers(updated);
    setUsersList(updated);
    refreshUsers();
    if (currentUser) {
      addAuditLog(currentUser, "USER_PROFILE_UPDATED", "User", editingUser.id, `Updated account for ${editingUser.name}`);
    }
    setEditingUser(null);
  };



  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      `${u.name} ${u.email} ${u.team || ""}`
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
            Authoritative provisioning center. Public registration is closed; all accounts are administered here.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          <UserPlus size={15} /> Create User Account
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2">
          <Search size={15} className="text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or team..."
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
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department / Team</th>
                <th className="py-3.5 px-4">Assigned PM</th>
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
                    </td>
                    <td className="py-4 px-4 text-[#aaa]">
                      <p>{m.team || "Unassigned"}</p>
                      <p className="text-[10px] text-[#666]">{m.department || "Organization"}</p>
                    </td>
                    <td className="py-4 px-4 text-[#888]">
                      {assignedPm ? assignedPm.name : m.role === "DEVELOPER" ? "None" : "—"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
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

            {createSuccessMsg ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 text-xs text-neutral-200 leading-relaxed">
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
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned Role</label>
                    <select
                      value={assignedRole}
                      onChange={(e) => setAssignedRole(e.target.value as UserRole)}
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
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Applied AI">Applied AI</option>
                      <option value="Executive">Executive Leadership</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned Team</label>
                    <select
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignedRole === "DEVELOPER" && (
                    <div>
                      <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned PM</label>
                      <select
                        value={assignedPmId || ""}
                        onChange={(e) => setAssignedPmId(Number(e.target.value))}
                        className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                      >
                        {projectManagers.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {assignedRole === "DEVELOPER" && (
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1">Engineering Specialty</label>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="UI/UX">UI/UX</option>
                      <option value="AI">AI / Machine Learning</option>
                      <option value="QA">QA & Verification</option>
                    </select>
                  </div>
                )}

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
                    Provision Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h3 className="text-base font-semibold text-white">Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-[#777] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
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

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Team</label>
                <input
                  type="text"
                  value={editingUser.team || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
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
      )}
    </div>
  );
};
