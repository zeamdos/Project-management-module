import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  PERMISSION_CATEGORIES,
  getRoles,
  getUserOverrides,
  removeUserOverride,
  resetRolesToDefault,
  saveRoles,
  saveUserOverride,
} from "../../services/permissions";
import { PermissionKey, RoleDefinition, User, UserPermissionOverride } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { addAuditLog, getStoredUsers } from "../../services/mockDataStore";

interface RolesPermissionsProps {
  initialSelectedUser?: User | null;
}

export const RolesPermissions: React.FC<RolesPermissionsProps> = ({
  initialSelectedUser,
}) => {
  const { user: currentUser } = useAuth();
  const [mode, setMode] = useState<"ROLE" | "USER">(initialSelectedUser ? "USER" : "ROLE");
  const [roles, setRoles] = useState<RoleDefinition[]>(getRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("PROJECT_MANAGER");

  const [usersList] = useState<User[]>(getStoredUsers);
  const [selectedUserId, setSelectedUserId] = useState<number>(
    initialSelectedUser?.id || usersList[3]?.id || 4
  );

  const [userOverrides, setUserOverrides] = useState<Record<number, UserPermissionOverride>>(
    getUserOverrides
  );

  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Create Custom Role Modal
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [baseCloneRoleId, setBaseCloneRoleId] = useState("DEVELOPER");

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const selectedUser = usersList.find((u) => u.id === selectedUserId) || usersList[0];

  // Resolve user's base role definition
  const userBaseRoleId =
    selectedUser.role === "MANAGER" || selectedUser.role === "PROJECT_MANAGER"
      ? "PROJECT_MANAGER"
      : selectedUser.customRoleId || selectedUser.role;

  const userBaseRole = roles.find(
    (r) => r.id.toUpperCase() === userBaseRoleId.toUpperCase()
  ) || roles.find((r) => r.id === "DEVELOPER") || roles[0];

  const currentUserOverride = userOverrides[selectedUser.id] || {
    userId: selectedUser.id,
    granted: [],
    revoked: [],
  };

  // Toggle permission for active role
  const handleToggleRolePermission = (permKey: PermissionKey) => {
    if (currentRole.id === "ADMIN") return; // Admin remains full authority

    const has = currentRole.permissions.includes(permKey);
    const updatedPerms = has
      ? currentRole.permissions.filter((p) => p !== permKey)
      : [...currentRole.permissions, permKey];

    const updatedRoles = roles.map((r) =>
      r.id === currentRole.id ? { ...r, permissions: updatedPerms } : r
    );

    setRoles(updatedRoles);
    saveRoles(updatedRoles);

    if (currentUser) {
      addAuditLog(
        currentUser,
        "ROLE_PERMISSION_MUTATED",
        "Role",
        currentRole.id,
        `${has ? "Revoked" : "Granted"} ${permKey} on role ${currentRole.name}`
      );
    }
  };

  // Toggle individual user override
  const handleToggleUserOverride = (permKey: PermissionKey) => {
    const isGrantedByRole = userBaseRole.permissions.includes(permKey);
    const isExplicitlyGranted = currentUserOverride.granted.includes(permKey);
    const isExplicitlyRevoked = currentUserOverride.revoked.includes(permKey);

    let nextGranted = [...currentUserOverride.granted];
    let nextRevoked = [...currentUserOverride.revoked];

    if (isGrantedByRole) {
      // If role gives it, clicking it toggles revoke on/off
      if (isExplicitlyRevoked) {
        nextRevoked = nextRevoked.filter((p) => p !== permKey);
      } else {
        nextRevoked.push(permKey);
      }
    } else {
      // If role does not give it, clicking it toggles grant on/off
      if (isExplicitlyGranted) {
        nextGranted = nextGranted.filter((p) => p !== permKey);
      } else {
        nextGranted.push(permKey);
      }
    }

    const nextOverride: UserPermissionOverride = {
      userId: selectedUser.id,
      granted: nextGranted,
      revoked: nextRevoked,
    };

    saveUserOverride(nextOverride);
    setUserOverrides({ ...userOverrides, [selectedUser.id]: nextOverride });

    if (currentUser) {
      addAuditLog(
        currentUser,
        "USER_OVERRIDE_MUTATED",
        "UserOverride",
        selectedUser.id,
        `Permission override set for ${selectedUser.name}: ${permKey}`
      );
    }
  };

  const handleClearUserOverrides = () => {
    removeUserOverride(selectedUser.id);
    const updated = { ...userOverrides };
    delete updated[selectedUser.id];
    setUserOverrides(updated);

    if (currentUser) {
      addAuditLog(
        currentUser,
        "USER_OVERRIDES_RESET",
        "UserOverride",
        selectedUser.id,
        `Cleared all permission overrides for ${selectedUser.name}`
      );
    }
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const baseRole = roles.find((r) => r.id === baseCloneRoleId);
    const roleId = newRoleName.trim().toUpperCase().replace(/\s+/g, "_");

    const newRole: RoleDefinition = {
      id: roleId,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || `Custom organization role ${newRoleName.trim()}`,
      isSystem: false,
      permissions: baseRole ? [...baseRole.permissions] : [],
    };

    const updated = [...roles, newRole];
    setRoles(updated);
    saveRoles(updated);
    setSelectedRoleId(roleId);
    setShowCreateRoleModal(false);
    setNewRoleName("");
    setNewRoleDesc("");

    if (currentUser) {
      addAuditLog(
        currentUser,
        "CUSTOM_ROLE_CREATED",
        "Role",
        roleId,
        `Created custom role ${newRole.name}`
      );
    }

    setSaveSuccessMsg(`Custom role "${newRole.name}" created and configured.`);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const roleToDelete = roles.find((r) => r.id === roleId);
    if (!roleToDelete || roleToDelete.isSystem) return;

    if (!confirm(`Are you sure you want to delete custom role "${roleToDelete.name}"?`)) return;

    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    saveRoles(updated);
    setSelectedRoleId("DEVELOPER");

    if (currentUser) {
      addAuditLog(
        currentUser,
        "CUSTOM_ROLE_DELETED",
        "Role",
        roleId,
        `Deleted custom role ${roleToDelete.name}`
      );
    }
  };

  const handleRestoreDefaults = () => {
    if (!confirm("Reset all roles to their standard factory permissions? Custom roles will be preserved.")) return;
    const restored = resetRolesToDefault();
    setRoles(restored);

    if (currentUser) {
      addAuditLog(
        currentUser,
        "ROLES_RESET_DEFAULT",
        "Role",
        "ALL",
        "Restored default role permissions matrix"
      );
    }

    setSaveSuccessMsg("Default role permissions restored.");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Mode Switcher */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Roles & Permissions Matrix
          </h1>
          <p className="mt-1 text-xs text-[#888]">
            Fine-grained access control. Configure standard roles, provision custom roles, or set individual user overrides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-[#303030] bg-[#141414] p-1">
            <button
              onClick={() => setMode("ROLE")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                mode === "ROLE" ? "bg-[#292929] text-white" : "text-[#777] hover:text-[#bbb]"
              }`}
            >
              Role Matrix
            </button>
            <button
              onClick={() => setMode("USER")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                mode === "USER" ? "bg-[#292929] text-white" : "text-[#777] hover:text-[#bbb]"
              }`}
            >
              User Overrides
            </button>
          </div>

          <button
            onClick={() => setShowCreateRoleModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#333] bg-[#181818] px-3.5 py-2 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
          >
            <Plus size={14} /> Custom Role
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/60 p-4 text-xs text-neutral-200">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Target Selection Bar */}
      <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5">
        {mode === "ROLE" ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#777]">
                  Target Role
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {currentRole.name} {currentRole.isSystem ? "(System Role)" : "(Custom Role)"}
                </p>
                <p className="text-xs text-[#888] mt-0.5">{currentRole.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {!currentRole.isSystem && (
                  <button
                    onClick={() => handleDeleteCustomRole(currentRole.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
                  >
                    <Trash2 size={13} /> Delete Role
                  </button>
                )}
                <button
                  onClick={handleRestoreDefaults}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#888] hover:text-white"
                >
                  <RotateCcw size={13} /> Restore Defaults
                </button>
              </div>
            </div>

            {/* Role Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#242424]">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                    selectedRoleId === r.id
                      ? "border-neutral-500 bg-[#252525] text-white shadow-md"
                      : "border-[#2d2d2d] bg-[#111] text-[#888] hover:border-[#444] hover:text-[#ccc]"
                  }`}
                >
                  {r.name}
                  {r.id === "ADMIN" && <span className="ml-1.5 text-[10px] text-neutral-400">★</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#777]">
                  User Specific Override Target
                </span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {selectedUser.name} · Role: {selectedUser.role}
                </p>
                <p className="text-xs text-[#888] mt-0.5">
                  Individual overrides take precedence over the user's role permissions.
                </p>
              </div>

              {(currentUserOverride.granted.length > 0 || currentUserOverride.revoked.length > 0) && (
                <button
                  onClick={handleClearUserOverrides}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#1a1a1a] px-3 py-1.5 text-xs text-[#aaa] hover:text-white"
                >
                  <RotateCcw size={13} /> Clear Overrides for User
                </button>
              )}
            </div>

            {/* User Selector Dropdown */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#242424]">
              <div className="flex-1 max-w-md">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-4 py-2 text-xs text-white outline-none focus:border-[#777]"
                >
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#777]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-neutral-300" />
                  <span>Granted by Base Role</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Granted by Override</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <span>Revoked by Override</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Matrix categorized */}
      <div className="space-y-6">
        {PERMISSION_CATEGORIES.map((category) => {
          const catPermissions = ALL_PERMISSIONS.filter(
            (p) => p.category === category.id
          );

          return (
            <section
              key={category.id}
              className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden"
            >
              <div className="border-b border-[#242424] bg-[#171717] px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                  {category.label}
                </h3>
              </div>

              <div className="divide-y divide-[#222]">
                {catPermissions.map((perm) => {
                  let isEnabled = false;
                  let badgeType: "ROLE" | "OVERRIDE_GRANTED" | "OVERRIDE_REVOKED" = "ROLE";

                  if (mode === "ROLE") {
                    isEnabled =
                      currentRole.id === "ADMIN" ||
                      currentRole.permissions.includes(perm.key);
                  } else {
                    const isBase = userBaseRole.permissions.includes(perm.key);
                    const isGranted = currentUserOverride.granted.includes(perm.key);
                    const isRevoked = currentUserOverride.revoked.includes(perm.key);

                    if (isRevoked) {
                      isEnabled = false;
                      badgeType = "OVERRIDE_REVOKED";
                    } else if (isGranted) {
                      isEnabled = true;
                      badgeType = "OVERRIDE_GRANTED";
                    } else {
                      isEnabled = isBase;
                      badgeType = "ROLE";
                    }
                  }

                  const isDisabled = mode === "ROLE" && currentRole.id === "ADMIN";

                  return (
                    <div
                      key={perm.key}
                      onClick={() => {
                        if (isDisabled) return;
                        if (mode === "ROLE") handleToggleRolePermission(perm.key);
                        else handleToggleUserOverride(perm.key);
                      }}
                      className={`flex items-start justify-between gap-4 p-4 transition ${
                        isDisabled ? "cursor-not-allowed opacity-90" : "cursor-pointer hover:bg-[#181818]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {perm.label}
                          </span>
                          <span className="font-mono text-[10px] text-[#666]">
                            {perm.key}
                          </span>
                          {mode === "USER" && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                                badgeType === "OVERRIDE_GRANTED"
                                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-900/60"
                                  : badgeType === "OVERRIDE_REVOKED"
                                  ? "bg-red-950/60 text-red-300 border border-red-900/60"
                                  : "bg-[#222] text-[#888]"
                              }`}
                            >
                              {badgeType === "OVERRIDE_GRANTED"
                                ? "Override: Granted"
                                : badgeType === "OVERRIDE_REVOKED"
                                ? "Override: Revoked"
                                : "From Role"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#777]">{perm.description}</p>
                      </div>

                      <div className="pt-0.5">
                        <div
                          className={`flex h-5 w-9 items-center rounded-full transition-colors ${
                            isEnabled ? "bg-neutral-200" : "bg-[#282828]"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded-full bg-black shadow-md transition-transform ${
                              isEnabled ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Create Custom Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#242424] pb-4">
              <h3 className="text-base font-semibold text-white">Create Custom Role</h3>
              <button
                onClick={() => setShowCreateRoleModal(false)}
                className="text-[#777] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Senior Developer, QA Lead, DevOps Engineer"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Description</label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="What scope of work does this role cover?"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Clone Permissions From</label>
                <select
                  value={baseCloneRoleId}
                  onChange={(e) => setBaseCloneRoleId(e.target.value)}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRoleModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                >
                  Create Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
